import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { DiagramType } from "./diagram-schema";

export const DIAGRAM_CONTEXT_LIMITS = { maxItemChars: 240, maxTotalChars: 12000, maxItems: 80 } as const;

export type DiagramContext = {
  projectId: string;
  projectName: string;
  selectedText: string[];
  visibleText: string[];
  existingNodeCount: number;
  existingEdgeCount: number;
  requestedDiagramType?: DiagramType;
};

function cleanText(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

function boundedText(value: string): string {
  return cleanText(value).slice(0, DIAGRAM_CONTEXT_LIMITS.maxItemChars);
}

function uniqueText(values: string[]): string[] {
  const seen = new Set<string>();
  return values.map(boundedText).filter((value) => value.length > 0).filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  }).slice(0, DIAGRAM_CONTEXT_LIMITS.maxItems);
}

function capTotal(values: string[], remaining: { value: number }): string[] {
  return values.flatMap((value) => {
    if (remaining.value <= 0) return [];
    const item = value.slice(0, remaining.value);
    remaining.value -= item.length;
    return item.length > 0 ? [item] : [];
  });
}

function textFromElements(elements: readonly ExcalidrawElement[]): string[] {
  return elements.flatMap((element) => (element.type === "text" ? [element.text] : []));
}

export function createDiagramContext(args: {
  projectId: string;
  projectName: string;
  elements: readonly ExcalidrawElement[];
  selectedElements?: readonly ExcalidrawElement[];
  requestedDiagramType?: DiagramType;
}): DiagramContext {
  const allText = uniqueText(textFromElements(args.elements));
  const selectedText = uniqueText(textFromElements(args.selectedElements ?? []));
  const remaining = { value: DIAGRAM_CONTEXT_LIMITS.maxTotalChars };
  return {
    projectId: cleanText(args.projectId),
    projectName: boundedText(args.projectName),
    selectedText: capTotal(selectedText, remaining),
    visibleText: capTotal(allText, remaining),
    existingNodeCount: args.elements.filter((element) => ["rectangle", "diamond", "ellipse"].includes(element.type)).length,
    existingEdgeCount: args.elements.filter((element) => ["arrow", "line"].includes(element.type)).length,
    ...(args.requestedDiagramType ? { requestedDiagramType: args.requestedDiagramType } : {}),
  };
}