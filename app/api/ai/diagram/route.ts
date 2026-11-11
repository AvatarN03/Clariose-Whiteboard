import { currentUser } from "@clerk/nextjs/server";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { boards } from "@/db/schema";
import { getShareByToken } from "@/lib/boards/sharing";
import { DIAGRAM_CONTEXT_LIMITS, type DiagramContext } from "@/lib/ai/diagram-context";
import { isDiagramType, type DiagramType } from "@/lib/ai/diagram-schema";
import { AiProviderError, generateDiagram } from "@/lib/ai/provider";
import { consumeAiRateLimit } from "@/lib/ai/rate-limit";

function envLimit(name: string, fallback: number, min: number, max: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.floor(value))) : fallback;
}

const MAX_PROMPT_CHARS = envLimit("AI_MAX_PROMPT_CHARS", 4_000, 100, 20_000);
const MAX_CONTEXT_CHARS = envLimit("AI_MAX_CONTEXT_CHARS", DIAGRAM_CONTEXT_LIMITS.maxTotalChars, 1_000, 50_000);
const MAX_BODY_CHARS = Math.max(128_000, MAX_PROMPT_CHARS + MAX_CONTEXT_CHARS * 4);

function hashForLog(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function logAiEvent(event: string, details: Record<string, unknown>) {
  console.info("ai_diagram", { event, ...details });
}

type DiagramRequest = {
  projectId: string;
  prompt: string;
  context: DiagramContext;
  diagramType?: DiagramType;
  shareToken?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBoundedStringArray(value: unknown, maxItems: number, maxItemChars: number): value is string[] {
  return Array.isArray(value) && value.length <= maxItems && value.every((item) => typeof item === "string" && item.length <= maxItemChars);
}

function parseRequest(value: unknown): { success: true; data: DiagramRequest } | { success: false; error: string } {
  if (!isRecord(value)) return { success: false, error: "A JSON request body is required." };
  if (typeof value.projectId !== "string" || value.projectId.trim().length === 0 || value.projectId.length > 200) return { success: false, error: "A valid project ID is required." };
  if (value.shareToken !== undefined && (typeof value.shareToken !== "string" || value.shareToken.length === 0 || value.shareToken.length > 200)) return { success: false, error: "An invalid share token was provided." };
  if (typeof value.prompt !== "string" || value.prompt.trim().length === 0 || value.prompt.length > MAX_PROMPT_CHARS) return { success: false, error: `Prompt must be between 1 and ${MAX_PROMPT_CHARS} characters.` };
  if (value.diagramType !== undefined && !isDiagramType(value.diagramType)) return { success: false, error: "The requested diagram type is not supported." };
  if (!isRecord(value.context)) return { success: false, error: "A diagram context is required." };

  const context = value.context;
  const existingNodeCount = context.existingNodeCount;
  const existingEdgeCount = context.existingEdgeCount;
  if (
    typeof context.projectId !== "string" ||
    typeof context.projectName !== "string" ||
    !isBoundedStringArray(context.selectedText, DIAGRAM_CONTEXT_LIMITS.maxItems, DIAGRAM_CONTEXT_LIMITS.maxItemChars) ||
    !isBoundedStringArray(context.visibleText, DIAGRAM_CONTEXT_LIMITS.maxItems, DIAGRAM_CONTEXT_LIMITS.maxItemChars) ||
    typeof existingNodeCount !== "number" || !Number.isInteger(existingNodeCount) || existingNodeCount < 0 ||
    typeof existingEdgeCount !== "number" || !Number.isInteger(existingEdgeCount) || existingEdgeCount < 0 ||
    (context.requestedDiagramType !== undefined && !isDiagramType(context.requestedDiagramType))
  ) return { success: false, error: "The diagram context is invalid." };

  if (context.projectId !== value.projectId) return { success: false, error: "Context project ID does not match the request." };
  const contextTextLength = context.projectName.length + context.selectedText.reduce((total, item) => total + item.length, 0) + context.visibleText.reduce((total, item) => total + item.length, 0);
  if (contextTextLength > MAX_CONTEXT_CHARS) return { success: false, error: "Diagram context is too large." };

  return {
    success: true,
    data: {
      projectId: value.projectId,
      prompt: value.prompt.trim(),
      context: context as DiagramContext,
      ...(value.diagramType ? { diagramType: value.diagramType } : {}),
      ...(value.shareToken ? { shareToken: value.shareToken } : {}),
    },
  };
}

function errorResponse(error: AiProviderError, requestId: string) {
  const status = error.kind === "configuration" ? 503 : error.kind === "timeout" ? 504 : error.kind === "rate-limit" ? 429 : error.kind === "malformed" ? 502 : 502;
  const code = error.kind === "configuration" ? "provider_not_configured" : error.kind === "timeout" ? "provider_timeout" : error.kind === "rate-limit" ? "provider_rate_limited" : error.kind === "malformed" ? "provider_invalid_output" : "provider_unavailable";
  return Response.json({ error: "AI diagram generation failed.", code, requestId }, { status });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized", requestId }, { status: 401 });

  const userEmail = user.primaryEmailAddress?.emailAddress;
  if (!userEmail) return Response.json({ error: "Your account does not have a primary email address.", requestId }, { status: 400 });

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_CHARS * 4) return Response.json({ error: "Request body is too large.", requestId }, { status: 413 });

  let rawBody: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) return Response.json({ error: "Request body is too large.", requestId }, { status: 413 });
    rawBody = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid request body.", requestId }, { status: 400 });
  }

  const parsed = parseRequest(rawBody);
  if (!parsed.success) return Response.json({ error: parsed.error, requestId }, { status: 400 });

  if (process.env.AI_DIAGRAM_ENABLED === "false") {
    logAiEvent("disabled", { requestId, userIdHash: hashForLog(user.id), projectIdHash: hashForLog(parsed.data.projectId) });
    return Response.json({ error: "AI diagram generation is temporarily disabled.", code: "feature_disabled", requestId }, { status: 503 });
  }

  try {
    let board: { projectId: string; projectName: string } | undefined;
    if (parsed.data.shareToken) {
      const share = await getShareByToken(parsed.data.shareToken);
      const shareEmail = share?.email.toLowerCase();
      if (
        !share ||
        share.projectId !== parsed.data.projectId ||
        shareEmail !== userEmail.toLowerCase() ||
        share.permission !== "editor"
      ) {
        return Response.json({ error: "You do not have editor access to this shared board.", requestId }, { status: 403 });
      }
      board = { projectId: share.projectId, projectName: share.projectName };
    } else {
      const [ownedBoard] = await db
        .select({ projectId: boards.projectId, projectName: boards.projectName })
        .from(boards)
        .where(and(eq(boards.projectId, parsed.data.projectId), eq(boards.userEmail, userEmail)))
        .limit(1);
      board = ownedBoard;
    }
    if (!board) return Response.json({ error: "Project not found.", requestId }, { status: 404 });

    const rateLimit = consumeAiRateLimit(user.id, parsed.data.projectId);
    if (!rateLimit.allowed) {
      logAiEvent("rate_limited", {
        requestId,
        userIdHash: hashForLog(user.id),
        projectIdHash: hashForLog(parsed.data.projectId),
        scope: rateLimit.scope,
      });
      return Response.json(
        { error: "AI request limit reached. Please try again shortly.", code: "rate_limited", requestId },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 60) } },
      );
    }

    const result = await generateDiagram({
      prompt: parsed.data.prompt,
      context: { ...parsed.data.context, projectName: board.projectName },
      diagramType: parsed.data.diagramType,
    });
    logAiEvent("success", {
      requestId,
      userIdHash: hashForLog(user.id),
      projectIdHash: hashForLog(parsed.data.projectId),
      provider: result.provider,
      model: result.model,
      fallbackUsed: result.fallbackUsed,
      latencyMs: Date.now() - startedAt,
      nodeCount: result.proposal.nodes.length,
      edgeCount: result.proposal.edges.length,
      inputTokens: result.usage?.inputTokens,
      outputTokens: result.usage?.outputTokens,
    });
    return Response.json({
      requestId,
      proposal: result.proposal,
      warnings: [
        ...result.proposal.warnings,
        ...(result.fallbackUsed ? ["The configured primary AI provider was unavailable; a fallback provider generated this proposal."] : []),
      ],
      ...(result.usage ? { usage: result.usage } : {}),
    });
  } catch (error) {
    if (error instanceof AiProviderError) {
      logAiEvent("provider_failure", {
        requestId,
        userIdHash: hashForLog(user.id),
        projectIdHash: hashForLog(parsed.data.projectId),
        provider: error.provider,
        kind: error.kind,
        status: error.status,
        latencyMs: Date.now() - startedAt,
      });
      return errorResponse(error, requestId);
    }
    logAiEvent("internal_failure", {
      requestId,
      userIdHash: hashForLog(user.id),
      projectIdHash: hashForLog(parsed.data.projectId),
      latencyMs: Date.now() - startedAt,
    });
    return Response.json({ error: "Unable to generate an AI diagram right now.", code: "internal_error", requestId }, { status: 500 });
  }
}
