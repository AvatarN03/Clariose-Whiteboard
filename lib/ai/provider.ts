import type { DiagramContext } from "./diagram-context";
import { DIAGRAM_PROPOSAL_JSON_SCHEMA, DIAGRAM_SYSTEM_PROMPT, buildDiagramUserPrompt, parseDiagramProviderText } from "./prompts";
import { validateDiagramProposal, type DiagramProposal, type DiagramType } from "./diagram-schema";

export type AiProviderName = "gemini" | "openrouter";

export type DiagramGenerationInput = {
  prompt: string;
  context: DiagramContext;
  diagramType?: DiagramType;
};

export type DiagramProviderResult = {
  proposal: DiagramProposal;
  usage?: { inputTokens?: number; outputTokens?: number };
  provider: AiProviderName;
  model: string;
};

export type AiProviderErrorKind = "configuration" | "timeout" | "rate-limit" | "malformed" | "provider";

export class AiProviderError extends Error {
  readonly kind: AiProviderErrorKind;
  readonly status?: number;
  readonly provider: AiProviderName;

  constructor(provider: AiProviderName, kind: AiProviderErrorKind, message: string, status?: number) {
    super(message);
    this.name = "AiProviderError";
    this.provider = provider;
    this.kind = kind;
    this.status = status;
  }
}

type AiConfig = {
  provider: AiProviderName;
  model: string;
  fallbackProvider?: AiProviderName;
  timeoutMs: number;
  maxOutputTokens: number;
};

function envNumber(name: string, fallback: number, min: number, max: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.floor(value))) : fallback;
}

function providerFromEnv(value: string | undefined): AiProviderName | undefined {
  return value === "gemini" || value === "openrouter" ? value : undefined;
}

export function getAiConfig(): AiConfig {
  const provider = providerFromEnv(process.env.AI_PROVIDER) ?? "gemini";
  const fallbackProvider = providerFromEnv(process.env.AI_FALLBACK_PROVIDER);
  return {
    provider,
    model: process.env.AI_MODEL?.trim() || "gemini-3.8-flash",
    fallbackProvider: fallbackProvider && fallbackProvider !== provider ? fallbackProvider : undefined,
    timeoutMs: envNumber("AI_REQUEST_TIMEOUT_MS", 30_000, 1_000, 60_000),
    maxOutputTokens: envNumber("AI_MAX_OUTPUT_TOKENS", 4_096, 256, 16_384),
  };
}

function getProviderKey(provider: AiProviderName): string | undefined {
  return provider === "gemini" ? process.env.GEMINI_API_KEY?.trim() : process.env.OPENROUTER_API_KEY?.trim();
}

function getProviderModel(provider: AiProviderName, config: AiConfig): string {
  if (provider === "openrouter") return process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";
  return config.model;
}

async function fetchProvider(url: string, init: RequestInit, provider: AiProviderName, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiProviderError(provider, "timeout", "The AI provider timed out.");
    }
    throw new AiProviderError(provider, "provider", "The AI provider could not be reached.");
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson(response: Response, provider: AiProviderName): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // Convert all provider response parsing failures into the stable provider error below.
  }
  throw new AiProviderError(provider, "provider", "The AI provider returned an unreadable response.", response.status);
}

function classifyHttpFailure(provider: AiProviderName, response: Response): never {
  if (response.status === 408 || response.status === 429) {
    throw new AiProviderError(provider, "rate-limit", "The AI provider is temporarily rate limited.", response.status);
  }
  if (response.status >= 500) {
    throw new AiProviderError(provider, "provider", "The AI provider is temporarily unavailable.", response.status);
  }
  throw new AiProviderError(provider, "provider", "The AI provider rejected the request.", response.status);
}

function extractGeminiText(body: Record<string, unknown>, provider: AiProviderName): string {
  const candidates = Array.isArray(body.candidates) ? body.candidates : [];
  const firstCandidate = candidates[0];
  const content = firstCandidate && typeof firstCandidate === "object" && !Array.isArray(firstCandidate)
    ? (firstCandidate as Record<string, unknown>).content
    : undefined;
  const parts = content && typeof content === "object" && !Array.isArray(content)
    ? (content as Record<string, unknown>).parts
    : undefined;
  const text = Array.isArray(parts)
    ? parts.map((part) => part && typeof part === "object" ? (part as Record<string, unknown>).text : undefined).find((value): value is string => typeof value === "string")
    : undefined;
  if (!text) throw new AiProviderError(provider, "malformed", "The AI provider returned no diagram content.");
  return text;
}

function extractOpenRouterText(body: Record<string, unknown>, provider: AiProviderName): string {
  const choices = Array.isArray(body.choices) ? body.choices : [];
  const message = choices[0] && typeof choices[0] === "object" && !Array.isArray(choices[0])
    ? (choices[0] as Record<string, unknown>).message
    : undefined;
  const content = message && typeof message === "object" && !Array.isArray(message)
    ? (message as Record<string, unknown>).content
    : undefined;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const text = content.map((part) => part && typeof part === "object" ? (part as Record<string, unknown>).text : undefined).find((value): value is string => typeof value === "string");
    if (text) return text;
  }
  throw new AiProviderError(provider, "malformed", "The AI provider returned no diagram content.");
}

function usageFrom(body: Record<string, unknown>): { inputTokens?: number; outputTokens?: number } | undefined {
  const usage = body.usageMetadata ?? body.usage;
  if (!usage || typeof usage !== "object" || Array.isArray(usage)) return undefined;
  const record = usage as Record<string, unknown>;
  const inputTokens = record.promptTokenCount ?? record.prompt_tokens;
  const outputTokens = record.candidatesTokenCount ?? record.completion_tokens;
  return {
    ...(typeof inputTokens === "number" ? { inputTokens } : {}),
    ...(typeof outputTokens === "number" ? { outputTokens } : {}),
  };
}

async function callGemini(input: DiagramGenerationInput, config: AiConfig): Promise<DiagramProviderResult> {
  const provider: AiProviderName = "gemini";
  const key = getProviderKey(provider);
  if (!key) throw new AiProviderError(provider, "configuration", "GEMINI_API_KEY is not configured.");
  const model = getProviderModel(provider, config).replace(/^models\//, "");
  const response = await fetchProvider(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: DIAGRAM_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: buildDiagramUserPrompt(input) }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: config.maxOutputTokens,
          responseMimeType: "application/json",
          responseJsonSchema: DIAGRAM_PROPOSAL_JSON_SCHEMA,
        },
      }),
    },
    provider,
    config.timeoutMs,
  );
  if (!response.ok) classifyHttpFailure(provider, response);
  const body = await readJson(response, provider);
  return { proposal: validateProviderProposal(extractGeminiText(body, provider), provider), usage: usageFrom(body), provider, model };
}

async function callOpenRouter(input: DiagramGenerationInput, config: AiConfig): Promise<DiagramProviderResult> {
  const provider: AiProviderName = "openrouter";
  const key = getProviderKey(provider);
  if (!key) throw new AiProviderError(provider, "configuration", "OPENROUTER_API_KEY is not configured.");
  const model = getProviderModel(provider, config);
  const response = await fetchProvider(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: DIAGRAM_SYSTEM_PROMPT },
          { role: "user", content: buildDiagramUserPrompt(input) },
        ],
        temperature: 0.2,
        max_tokens: config.maxOutputTokens,
        provider: { require_parameters: true },
        response_format: { type: "json_schema", json_schema: { name: "diagram_proposal", strict: true, schema: DIAGRAM_PROPOSAL_JSON_SCHEMA } },
      }),
    },
    provider,
    config.timeoutMs,
  );
  if (!response.ok) classifyHttpFailure(provider, response);
  const body = await readJson(response, provider);
  return { proposal: validateProviderProposal(extractOpenRouterText(body, provider), provider), usage: usageFrom(body), provider, model };
}

function validateProviderProposal(text: string, provider: AiProviderName): DiagramProposal {
  const parsed = parseDiagramProviderText(text);
  const result = validateDiagramProposal(parsed);
  if (!result.success) throw new AiProviderError(provider, "malformed", "The AI provider returned an invalid diagram proposal.");
  return result.data;
}

function shouldTryFallback(error: AiProviderError): boolean {
  return error.kind === "timeout" || error.kind === "rate-limit" || error.kind === "provider";
}

export async function generateDiagram(input: DiagramGenerationInput): Promise<DiagramProviderResult & { fallbackUsed: boolean }> {
  const config = getAiConfig();
  const providers = [config.provider, config.fallbackProvider].filter((provider, index, all): provider is AiProviderName => Boolean(provider) && all.indexOf(provider) === index);
  let lastError: AiProviderError | undefined;
  for (const [index, provider] of providers.entries()) {
    try {
      const result = provider === "gemini" ? await callGemini(input, config) : await callOpenRouter(input, config);
      return { ...result, fallbackUsed: index > 0 };
    } catch (error) {
      const providerError = error instanceof AiProviderError ? error : new AiProviderError(provider, "provider", "The AI provider failed.");
      lastError = providerError;
      if (index === providers.length - 1 || !shouldTryFallback(providerError)) throw providerError;
    }
  }
  throw lastError ?? new AiProviderError(config.provider, "configuration", "No AI provider is configured.");
}
