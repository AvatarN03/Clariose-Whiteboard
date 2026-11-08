import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { getDiagramColor } from "./diagram-colors";
import { layoutDiagram, type DiagramViewport } from "./diagram-layout";
import { DIAGRAM_LIMITS, type DiagramProposal } from "./diagram-schema";

type ExcalidrawElementSkeleton = NonNullable<Parameters<typeof convertToExcalidrawElements>[0]>[number];

export type CompiledDiagram = {
  elements: ExcalidrawElement[];
  generatedElementIds: string[];
  generatedGroupId: string;
  skippedEdgeIds: string[];
};

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function idFor(groupId: string, value: string): string {
  return `ai-${groupId}-${hash(value).toString(36)}`;
}

function center(layout: { x: number; y: number; width: number; height: number }) {
  return { x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 };
}

function midpoint(from: { x: number; y: number }, to: { x: number; y: number }) {
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
}

export function compileDiagramProposal(proposal: DiagramProposal, options: { viewport?: DiagramViewport; existingElements?: readonly ExcalidrawElement[] } = {}): CompiledDiagram {
  const groupId = idFor("group", `${proposal.version}:${proposal.title}:${proposal.nodes.map((node) => node.id).join(",")}`);
  const layout = layoutDiagram(proposal, options.viewport, options.existingElements);
  const skeletons: ExcalidrawElementSkeleton[] = [];
  const nodeElementIds = new Map<string, string>();

  proposal.nodes.forEach((node) => {
    const nodeLayout = layout.get(node.id);
    if (!nodeLayout) return;
    const color = getDiagramColor(node.color, node.kind);
    const nodeId = idFor(groupId, `node:${node.id}`);
    const textId = idFor(groupId, `text:${node.id}`);
    skeletons.push({
      type: node.kind === "decision" ? "diamond" : node.kind === "root" ? "ellipse" : "rectangle",
      id: nodeId, x: nodeLayout.x, y: nodeLayout.y, width: nodeLayout.width, height: nodeLayout.height,
      strokeColor: color.stroke, backgroundColor: color.background, fillStyle: "solid", groupIds: [groupId],
      seed: hash(`${nodeId}:seed`), versionNonce: hash(`${nodeId}:nonce`),
      customData: { aiGenerated: true, aiGroupId: groupId, sourceNodeId: node.id },
    });
    skeletons.push({
      type: "text",
      id: textId, x: nodeLayout.x + 16, y: nodeLayout.y + 30,
      text: node.label.slice(0, DIAGRAM_LIMITS.maxLabelChars), fontSize: 20, groupIds: [groupId],
      customData: { aiGenerated: true, aiGroupId: groupId, sourceNodeId: node.id },
    });
    nodeElementIds.set(node.id, nodeId);
  });

  const skippedEdgeIds: string[] = [];
  proposal.edges.forEach((edge) => {
    const from = layout.get(edge.from);
    const to = layout.get(edge.to);
    if (!from || !to || !nodeElementIds.has(edge.from) || !nodeElementIds.has(edge.to)) {
      skippedEdgeIds.push(edge.id);
      return;
    }
    const start = center(from);
    const end = center(to);
    const label = edge.label?.slice(0, DIAGRAM_LIMITS.maxLabelChars);
    skeletons.push({
      type: "arrow", id: idFor(groupId, `edge:${edge.id}`), x: start.x, y: start.y,
      points: [[0, 0], [end.x - start.x, end.y - start.y]], startArrowhead: null, endArrowhead: "arrow",
      strokeColor: "#4b5563", groupIds: [groupId],
      customData: { aiGenerated: true, aiGroupId: groupId, sourceEdgeId: edge.id, label: edge.label, relation: edge.relation },
    });
    if (label) {
      const labelPosition = midpoint(start, end);
      skeletons.push({
        type: "text",
        id: idFor(groupId, `edge-label:${edge.id}`),
        x: labelPosition.x,
        y: labelPosition.y - 14,
        text: label,
        fontSize: 14,
        groupIds: [groupId],
        customData: { aiGenerated: true, aiGroupId: groupId, sourceEdgeId: edge.id, edgeLabel: true },
      });
    }
  });

  const elements = convertToExcalidrawElements(skeletons, { regenerateIds: false }) as ExcalidrawElement[];

  return { elements, generatedElementIds: elements.map((element) => element.id), generatedGroupId: groupId, skippedEdgeIds };
}
