import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { DiagramProposal } from "./diagram-schema";

export type DiagramViewport = { x: number; y: number; width: number; height: number };
export type DiagramNodeLayout = { x: number; y: number; width: number; height: number };

const NODE_WIDTH = 180;
const NODE_HEIGHT = 84;
const GAP_X = 72;
const GAP_Y = 64;
const OFFSET_STEP = 48;

function bounds(elements: readonly ExcalidrawElement[]) {
  if (elements.length === 0) return null;
  return elements.reduce((result, element) => ({
    minX: Math.min(result.minX, element.x), minY: Math.min(result.minY, element.y),
    maxX: Math.max(result.maxX, element.x + element.width), maxY: Math.max(result.maxY, element.y + element.height),
  }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
}

function overlaps(left: DiagramNodeLayout, right: { minX: number; minY: number; maxX: number; maxY: number }) {
  return left.x < right.maxX && left.x + left.width > right.minX && left.y < right.maxY && left.y + left.height > right.minY;
}

function offsetFromExisting(layout: Map<string, DiagramNodeLayout>, existingElements: readonly ExcalidrawElement[]) {
  const existingBounds = bounds(existingElements);
  if (!existingBounds) return layout;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const offset = attempt * OFFSET_STEP;
    const shifted = new Map([...layout.entries()].map(([id, node]) => [id, { ...node, x: node.x + offset, y: node.y + offset }] as const));
    if ([...shifted.values()].every((node) => !overlaps(node, existingBounds))) return shifted;
  }
  return new Map([...layout.entries()].map(([id, node]) => [id, { ...node, x: node.x + 8 * OFFSET_STEP, y: node.y + 8 * OFFSET_STEP }] as const));
}

export function layoutDiagram(proposal: DiagramProposal, viewport: DiagramViewport = { x: 0, y: 0, width: 1200, height: 800 }, existingElements: readonly ExcalidrawElement[] = []) {
  const columns = Math.max(1, Math.ceil(Math.sqrt(proposal.nodes.length)));
  const rows = Math.max(1, Math.ceil(proposal.nodes.length / columns));
  const totalWidth = columns * NODE_WIDTH + (columns - 1) * GAP_X;
  const totalHeight = rows * NODE_HEIGHT + (rows - 1) * GAP_Y;
  const startX = viewport.x + (viewport.width - totalWidth) / 2;
  const startY = viewport.y + (viewport.height - totalHeight) / 2;
  const layout = new Map<string, DiagramNodeLayout>();
  proposal.nodes.forEach((node, index) => layout.set(node.id, {
    x: Math.round(startX + (index % columns) * (NODE_WIDTH + GAP_X)),
    y: Math.round(startY + Math.floor(index / columns) * (NODE_HEIGHT + GAP_Y)),
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  }));
  return offsetFromExisting(layout, existingElements);
}