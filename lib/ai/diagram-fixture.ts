import type { DiagramProposal, DiagramType } from "./diagram-schema";

export function createDiagramFixture(diagramType: DiagramType): DiagramProposal {
  return {
    version: 1,
    title: `${diagramType} fixture`,
    diagramType,
    summary: "A small deterministic fixture for compiler validation.",
    nodes: [
      { id: "goal", label: "Goal", kind: "root", color: "orange" },
      { id: "step", label: "First step", kind: "step", color: "blue" },
      { id: "decision", label: "Decision", kind: "decision", color: "yellow" },
    ],
    edges: [
      { id: "goal-to-step", from: "goal", to: "step", relation: "leads-to" },
      { id: "step-to-decision", from: "step", to: "decision", relation: "depends-on" },
    ],
    warnings: [],
  };
}