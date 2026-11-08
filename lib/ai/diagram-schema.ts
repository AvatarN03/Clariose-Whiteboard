export const DIAGRAM_TYPES = [
  "mind-map",
  "flowchart",
  "journey",
  "concept-map",
  "timeline",
  "matrix",
] as const;

export type DiagramType = (typeof DIAGRAM_TYPES)[number];

export const DIAGRAM_LIMITS = {
  minNodes: 1,
  maxNodes: 80,
  maxEdges: 120,
  maxLabelChars: 180,
  maxTitleChars: 120,
  maxSummaryChars: 600,
  maxWarningChars: 240,
  maxWarnings: 12,
} as const;

export type DiagramNodeKind =
  | "root"
  | "step"
  | "decision"
  | "risk"
  | "person"
  | "milestone"
  | "note";

export type DiagramColor =
  | "orange"
  | "yellow"
  | "blue"
  | "green"
  | "pink"
  | "neutral";

export type DiagramProposal = {
  version: 1;
  title: string;
  diagramType: DiagramType;
  summary: string;
  nodes: Array<{
    id: string;
    label: string;
    kind?: DiagramNodeKind;
    group?: string;
    color?: DiagramColor;
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    label?: string;
    relation?:
      | "leads-to"
      | "depends-on"
      | "blocks"
      | "supports"
      | "part-of";
  }>;
  warnings: string[];
};

export type DiagramValidationResult =
  | { success: true; data: DiagramProposal }
  | { success: false; errors: string[] };

const NODE_KINDS = new Set<DiagramNodeKind>([
  "root",
  "step",
  "decision",
  "risk",
  "person",
  "milestone",
  "note",
]);
const COLORS = new Set<DiagramColor>([
  "orange",
  "yellow",
  "blue",
  "green",
  "pink",
  "neutral",
]);
const RELATIONS = new Set([
  "leads-to",
  "depends-on",
  "blocks",
  "supports",
  "part-of",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: readonly string[]): boolean {
  const allowed = new Set(allowedKeys);
  return Object.keys(value).every((key) => allowed.has(key));
}

export function isDiagramType(value: unknown): value is DiagramType {
  return typeof value === "string" && DIAGRAM_TYPES.includes(value as DiagramType);
}

export function validateDiagramProposal(value: unknown): DiagramValidationResult {
  const errors: string[] = [];
  if (!isRecord(value) || value.version !== 1) {
    return { success: false, errors: ["Proposal version must be 1."] };
  }

  if (!hasOnlyKeys(value, ["version", "title", "diagramType", "summary", "nodes", "edges", "warnings"])) {
    errors.push("Proposal contains unknown fields.");
  }

  if (!isString(value.title, DIAGRAM_LIMITS.maxTitleChars)) errors.push("Title is missing or too long.");
  if (!isDiagramType(value.diagramType)) errors.push("Diagram type is not supported.");
  if (!isString(value.summary, DIAGRAM_LIMITS.maxSummaryChars)) errors.push("Summary is missing or too long.");
  if (!Array.isArray(value.nodes) || value.nodes.length < DIAGRAM_LIMITS.minNodes || value.nodes.length > DIAGRAM_LIMITS.maxNodes) errors.push(`Nodes must contain between ${DIAGRAM_LIMITS.minNodes} and ${DIAGRAM_LIMITS.maxNodes} items.`);
  if (!Array.isArray(value.edges) || value.edges.length > DIAGRAM_LIMITS.maxEdges) errors.push(`Edges must contain at most ${DIAGRAM_LIMITS.maxEdges} items.`);
  if (!Array.isArray(value.warnings) || value.warnings.length > DIAGRAM_LIMITS.maxWarnings) errors.push(`Warnings must contain at most ${DIAGRAM_LIMITS.maxWarnings} items.`);
  if (errors.length > 0) return { success: false, errors };

  const nodeIds = new Set<string>();
  for (const [index, rawNode] of (value.nodes as unknown[]).entries()) {
    if (!isRecord(rawNode) || !isString(rawNode.id, 100) || !isString(rawNode.label, DIAGRAM_LIMITS.maxLabelChars)) {
      errors.push(`Node ${index + 1} is invalid.`);
      continue;
    }
    if (!hasOnlyKeys(rawNode, ["id", "label", "kind", "group", "color"])) errors.push(`Node ${rawNode.id} contains unknown fields.`);
    if (nodeIds.has(rawNode.id)) errors.push(`Node ID is duplicated: ${rawNode.id}.`);
    nodeIds.add(rawNode.id);
    if (rawNode.kind !== undefined && (typeof rawNode.kind !== "string" || !NODE_KINDS.has(rawNode.kind as DiagramNodeKind))) errors.push(`Node ${rawNode.id} has an invalid kind.`);
    if (rawNode.color !== undefined && (typeof rawNode.color !== "string" || !COLORS.has(rawNode.color as DiagramColor))) errors.push(`Node ${rawNode.id} has an invalid color.`);
    if (rawNode.group !== undefined && !isString(rawNode.group, 100)) errors.push(`Node ${rawNode.id} has an invalid group.`);
  }

  const edgeIds = new Set<string>();
  for (const [index, rawEdge] of (value.edges as unknown[]).entries()) {
    if (!isRecord(rawEdge) || !isString(rawEdge.id, 100) || !isString(rawEdge.from, 100) || !isString(rawEdge.to, 100)) {
      errors.push(`Edge ${index + 1} is invalid.`);
      continue;
    }
    if (!hasOnlyKeys(rawEdge, ["id", "from", "to", "label", "relation"])) errors.push(`Edge ${rawEdge.id} contains unknown fields.`);
    if (edgeIds.has(rawEdge.id)) errors.push(`Edge ID is duplicated: ${rawEdge.id}.`);
    edgeIds.add(rawEdge.id);
    if (!nodeIds.has(rawEdge.from) || !nodeIds.has(rawEdge.to)) errors.push(`Edge ${rawEdge.id} references a missing node.`);
    if (rawEdge.label !== undefined && !isString(rawEdge.label, DIAGRAM_LIMITS.maxLabelChars)) errors.push(`Edge ${rawEdge.id} has an invalid label.`);
    if (rawEdge.relation !== undefined && (typeof rawEdge.relation !== "string" || !RELATIONS.has(rawEdge.relation))) errors.push(`Edge ${rawEdge.id} has an invalid relation.`);
  }

  if ((value.warnings as unknown[]).some((warning) => typeof warning !== "string" || warning.trim().length === 0 || warning.length > DIAGRAM_LIMITS.maxWarningChars)) errors.push("Warnings must be short strings.");
  return errors.length > 0 ? { success: false, errors } : { success: true, data: value as unknown as DiagramProposal };
}
