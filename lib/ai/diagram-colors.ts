import type { DiagramColor, DiagramNodeKind } from "./diagram-schema";

export const DIAGRAM_COLORS: Record<DiagramColor, { background: string; stroke: string }> = {
  orange: { background: "#fed7aa", stroke: "#c2410c" },
  yellow: { background: "#fef08a", stroke: "#a16207" },
  blue: { background: "#bfdbfe", stroke: "#1d4ed8" },
  green: { background: "#bbf7d0", stroke: "#15803d" },
  pink: { background: "#fbcfe8", stroke: "#be185d" },
  neutral: { background: "#e5e7eb", stroke: "#374151" },
};

const KIND_COLORS: Partial<Record<DiagramNodeKind, DiagramColor>> = { root: "orange", decision: "yellow", risk: "pink", person: "green", milestone: "blue", note: "neutral" };

export function getDiagramColor(color?: DiagramColor, kind?: DiagramNodeKind) {
  return DIAGRAM_COLORS[color ?? (kind ? KIND_COLORS[kind] : undefined) ?? "blue"];
}