import assert from "node:assert/strict";
import { createDiagramContext } from "../lib/ai/diagram-context";
import { createDiagramFixture } from "../lib/ai/diagram-fixture";
import { layoutDiagram } from "../lib/ai/diagram-layout";
import { validateDiagramProposal } from "../lib/ai/diagram-schema";

const fixture = createDiagramFixture("flowchart");
const valid = validateDiagramProposal(fixture);
assert.equal(valid.success, true);

const unknownField = validateDiagramProposal({ ...fixture, extra: true });
assert.equal(unknownField.success, false);

const duplicateEdge = validateDiagramProposal({
  ...fixture,
  edges: [...fixture.edges, { ...fixture.edges[0] }],
});
assert.equal(duplicateEdge.success, false);

const layout = layoutDiagram(fixture, { x: 0, y: 0, width: 1200, height: 800 });
const layoutAgain = layoutDiagram(fixture, { x: 0, y: 0, width: 1200, height: 800 });
assert.deepEqual(layout, layoutAgain);
assert.equal(layout.size, fixture.nodes.length);

const context = createDiagramContext({
  projectId: "project-1",
  projectName: "Launch plan",
  elements: [
    { type: "text", id: "text-1", text: "  Launch\nplan  " } as never,
    { type: "image", id: "image-1" } as never,
  ],
});
assert.deepEqual(context.visibleText, ["Launch plan"]);
assert.equal(context.existingNodeCount, 0);
assert.equal(context.existingEdgeCount, 0);

console.log("Phase 2 AI diagram checks passed.");
