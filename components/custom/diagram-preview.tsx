"use client";

import { AlertTriangle, GitBranch, ListTree, Sparkles } from "lucide-react";
import type { DiagramProposal } from "@/lib/ai/diagram-schema";

type DiagramPreviewProps = {
  proposal: DiagramProposal;
};

const diagramTypeLabels: Record<DiagramProposal["diagramType"], string> = {
  "mind-map": "Mind map",
  flowchart: "Flowchart",
  journey: "Journey map",
  "concept-map": "Concept map",
  timeline: "Timeline",
  matrix: "2D matrix",
};

export function DiagramPreview({ proposal }: DiagramPreviewProps) {
  return (
    <div className="space-y-4" aria-label="AI diagram proposal preview">
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <div className="mb-2 flex items-start gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#ec6338]/15 text-[#ec6338]">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {diagramTypeLabels[proposal.diagramType]}
            </p>
            <h3 className="mt-1 text-base font-semibold text-foreground">
              {proposal.title}
            </h3>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{proposal.summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border px-3 py-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ListTree className="size-3.5" aria-hidden="true" />
            <span className="text-xs">Nodes</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-foreground">{proposal.nodes.length}</p>
        </div>
        <div className="rounded-lg border border-border px-3 py-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GitBranch className="size-3.5" aria-hidden="true" />
            <span className="text-xs">Connections</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-foreground">{proposal.edges.length}</p>
        </div>
      </div>

      {proposal.warnings.length > 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4" aria-hidden="true" />
            Review before applying
          </div>
          <ul className="space-y-1 pl-5 text-xs leading-5">
            {proposal.warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
