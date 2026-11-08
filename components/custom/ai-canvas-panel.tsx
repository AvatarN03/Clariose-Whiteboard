"use client";

import * as React from "react";
import { Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { DiagramPreview } from "@/components/custom/diagram-preview";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DIAGRAM_TYPES, type DiagramProposal, type DiagramType } from "@/lib/ai/diagram-schema";
import type { DiagramContext } from "@/lib/ai/diagram-context";
import type { ApplyProposalResult } from "@/components/custom/whiteboard-component";

type AiCanvasPanelProps = {
  projectId: string;
  getContext: () => DiagramContext | null;
  onApply: (proposal: DiagramProposal, mode: "add" | "replace-selection") => ApplyProposalResult;
  onUndo: () => boolean;
  onSave: () => Promise<boolean>;
  isSaving: boolean;
  onClose: () => void;
};

type PanelState = "idle" | "generating" | "preview" | "error";

const examples = [
  "Create a flowchart for onboarding a new customer.",
  "Map the risks and owners for this product launch.",
  "Turn these ideas into a simple dependency map.",
];

const diagramTypeLabels: Record<DiagramType, string> = {
  "mind-map": "Mind map",
  flowchart: "Flowchart",
  journey: "Journey map",
  "concept-map": "Concept map",
  timeline: "Timeline",
  matrix: "2D matrix",
};

export function AiCanvasPanel({ projectId, getContext, onApply, onUndo, onSave, isSaving, onClose }: AiCanvasPanelProps) {
  const [prompt, setPrompt] = React.useState("");
  const [diagramType, setDiagramType] = React.useState<DiagramType | "">("");
  const [panelState, setPanelState] = React.useState<PanelState>("idle");
  const [proposal, setProposal] = React.useState<DiagramProposal | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [applied, setApplied] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const requestControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    return () => requestControllerRef.current?.abort();
  }, []);

  async function generate() {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || panelState === "generating") return;

    const context = getContext();
    if (!context) {
      setError("The whiteboard is still loading. Try again in a moment.");
      setPanelState("error");
      return;
    }

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setPanelState("generating");
    setError(null);
    setProposal(null);

    try {
      const response = await fetch("/api/ai/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          prompt: trimmedPrompt,
          context,
          ...(diagramType ? { diagramType } : {}),
        }),
        signal: controller.signal,
      });
      const data = (await response.json()) as {
        proposal?: DiagramProposal;
        error?: string;
        code?: string;
      };
      if (!response.ok || !data.proposal) {
        throw new Error(data.error || "The AI could not create a diagram proposal.");
      }
      setProposal(data.proposal);
      setPanelState("preview");
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === "AbortError") return;
      setError(requestError instanceof Error ? requestError.message : "The AI request failed. Try again.");
      setPanelState("error");
    } finally {
      if (requestControllerRef.current === controller) requestControllerRef.current = null;
    }
  }

  function resetPreview() {
    setProposal(null);
    setError(null);
    setPanelState("idle");
    setApplied(false);
    setSaved(false);
  }

  function apply(mode: "add" | "replace-selection") {
    if (!proposal) return;
    const result = onApply(proposal, mode);
    if (!result.success) {
      setError(result.error);
      setPanelState("error");
      return;
    }
    setError(null);
    setApplied(true);
    setSaved(false);
  }

  async function saveAppliedProposal() {
    const didSave = await onSave();
    setSaved(didSave);
  }

  const isGenerating = panelState === "generating";

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-l border-border bg-background md:w-[22rem] lg:w-[25rem]" aria-label="AI diagram helper">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-[#ec6338]/15 text-[#ec6338]">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">AI helper</h2>
            <p className="text-xs text-muted-foreground">Shape an idea into a diagram</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close AI helper">
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {panelState === "preview" && proposal ? (
          <>
            <DiagramPreview proposal={proposal} />
            {applied ? (
              <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200" role="status">
                Added to the canvas and selected. You can undo this insertion or save it to the workspace.
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                <button type="button" onClick={() => apply("add")} className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#ec6338] px-3 py-2.5 text-sm font-medium text-white hover:bg-[#d9562d]">
                  Add to board
                </button>
                <button type="button" onClick={() => apply("replace-selection")} className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
                  Replace selected AI group
                </button>
              </div>
            )}
            {applied ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { onUndo(); setApplied(false); setSaved(false); }} className="cursor-pointer rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent">Undo insertion</button>
                <button type="button" disabled={isSaving || saved} onClick={() => void saveAppliedProposal()} className="cursor-pointer rounded-lg bg-[#1d1d1b] px-3 py-2 text-xs font-medium text-white hover:bg-[#3b3a36] disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? "Saving..." : saved ? "Saved" : "Save workspace"}</button>
              </div>
            ) : null}
            <button type="button" onClick={resetPreview} className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
              <RotateCcw className="size-4" aria-hidden="true" />
              Create another proposal
            </button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="ai-diagram-prompt" className="text-xs font-medium text-foreground">What should we map?</label>
              <textarea
                id="ai-diagram-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="e.g. Map the dependencies and risks in this launch..."
                disabled={isGenerating}
                rows={5}
                maxLength={4000}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground focus:border-[#ec6338] focus:ring-2 focus:ring-[#ec6338]/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <p className="text-right text-[11px] text-muted-foreground">{prompt.length}/4000</p>
            </div>

            <div className="mt-4 space-y-2">
              <label htmlFor="ai-diagram-type" className="text-xs font-medium text-foreground">Diagram type</label>
              <Select
                value={diagramType}
                onValueChange={(value) => setDiagramType(value as DiagramType | "")}
                disabled={isGenerating}
              >
                <SelectTrigger id="ai-diagram-type" className="h-10 w-full focus-visible:border-[#ec6338] focus-visible:ring-[#ec6338]/20">
                  <SelectValue placeholder="Let AI choose" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="">Let AI choose</SelectItem>
                  {DIAGRAM_TYPES.map((type) => <SelectItem key={type} value={type}>{diagramTypeLabels[type]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              onClick={() => void generate()}
              disabled={!prompt.trim() || isGenerating}
              className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#ec6338] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#d9562d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
              {isGenerating ? "Creating proposal..." : "Create proposal"}
            </button>

            {panelState === "error" && error ? (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {error}
                <button type="button" onClick={() => void generate()} className="mt-2 block cursor-pointer text-xs font-medium underline">Try again</button>
              </div>
            ) : null}

            <div className="mt-6">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Try an example</p>
              <div className="space-y-2">
                {examples.map((example) => (
                  <button key={example} type="button" onClick={() => setPrompt(example)} disabled={isGenerating} className="w-full cursor-pointer rounded-lg border border-border px-3 py-2 text-left text-xs leading-5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60">
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
