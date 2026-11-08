# AI-Driven Canvas Diagram — Implementation Plan

## Objective

Turn Clariose from a manual Excalidraw whiteboard into an AI-assisted thinking workspace. A user should be able to describe a problem, ask AI to organize it, preview the proposed diagram, and apply the approved result to the current board without losing existing work.

The first release should optimize for a trustworthy, reversible workflow:

1. The user opens a board and sees the latest server snapshot.
2. The user opens an AI panel and enters a natural-language request.
3. AI returns a typed diagram proposal, not executable code and not an opaque serialized scene.
4. The user reviews the proposal and chooses **Add to board**, **Replace selection**, or **Cancel**.
5. The app converts the approved proposal into Excalidraw elements, places it in an empty area, and saves it through the existing workspace persistence path.

The implementation should begin with one-shot generation and deterministic client-side rendering. Streaming, multi-user real-time editing, and autonomous board mutation should remain later phases.

## Current-state findings

The repository is a Next.js 16 App Router application using React 19, Clerk authentication, Drizzle ORM, Neon Postgres, shadcn-style UI components, and `@excalidraw/excalidraw`.

### Existing building blocks

- [components/custom/whiteboard-component.tsx](../components/custom/whiteboard-component.tsx) owns the Excalidraw instance, current scene ref, localStorage snapshot, theme synchronization, custom tool rail, and imperative methods.
- [components/custom/workspace-view.tsx](../components/custom/workspace-view.tsx) owns the whiteboard/docs tabs, manual save flow, unsaved-change warning, and route transition behavior.
- [app/api/workspace/[projectId]/route.ts](../app/api/workspace/[projectId]/route.ts) accepts a complete `{ elements, appState, files }` snapshot and upserts it into `whiteboardData` after checking the Clerk user's email.
- [db/schema.ts](../db/schema.ts) stores board metadata in `boards` and one JSONB whiteboard snapshot per project in `whiteboardData`.
- [lib/boards/queries.ts](../lib/boards/queries.ts) already joins board metadata to saved whiteboard data for dashboard queries.
- [app/dashboard/ai-helper/page.tsx](../app/dashboard/ai-helper/page.tsx) is currently a placeholder and is the natural home for a future standalone AI entry point.
- [components/custom/workspace-header.tsx](../components/custom/workspace-header.tsx) has a placeholder Share action and a stable location for opening the AI experience.

### Current gaps and constraints

- The workspace route renders [components/custom/workspace-view.tsx](../components/custom/workspace-view.tsx) with only `projectId`; it does not fetch the saved database snapshot before mounting Excalidraw. A fresh browser can therefore start from a blank scene even when the board has server data.
- The existing workspace API only implements `POST`; a separate authenticated `GET` or server-loaded initial scene is required before AI can reliably use the latest board.
- The AI Helper page contains no conversation state, API route, provider integration, prompt schema, or error handling.
- The app currently has no AI SDK/provider dependency and no server-side AI boundary.
- Excalidraw elements are complex internal objects. The model must not be asked to construct raw Excalidraw elements directly.
- Current persistence is last-write-wins JSONB with a client-side five-second local save timer. AI insertion must participate in the same scene ref and save lifecycle.
- The working tree already contains user changes. Implementation should preserve unrelated modifications and add migrations only after confirming the final schema diff.

## Product scope

### MVP user journey

1. User opens `/workspace/:projectId`.
2. App resolves the authenticated user's board and loads the latest server scene; local unsynced work is handled explicitly.
3. User clicks **AI** in the workspace header or opens the AI Helper page.
4. A side panel asks for a goal, for example: “Turn this product launch into a dependency map with risks and owners.”
5. The panel sends the prompt plus a compact, sanitized board context to the server.
6. The server validates ownership, calls the selected model, validates structured output, and returns a proposal.
7. The client renders a proposal preview and a short explanation of the structure.
8. User approves an insertion mode and the client converts the proposal into elements.
9. The generated group is selected and labeled as AI-generated in client metadata so it can be undone, deleted, or regenerated.
10. The normal save path persists the resulting scene.

### Supported MVP diagram types

- Mind map
- Flowchart
- Process / journey map
- Concept map
- Simple timeline
- 2D matrix / quadrant

The user may request a free-form diagram, but the server should normalize it to one of these types or return a clarification request.

### Explicitly out of scope for MVP

- AI directly overwriting a board without confirmation
- Real-time multiplayer cursors or CRDT synchronization
- Image generation or OCR
- Importing arbitrary Mermaid, SVG, or JavaScript from the model
- AI access to another user's board
- Automatic sharing or external publishing
- Long-running autonomous agents

## Recommended architecture

```text
WorkspaceView
  ├─ WhiteboardComponent (Excalidraw + scene ref)
  └─ AiCanvasPanel (prompt, preview, approval)
          │
          ▼
POST /api/ai/diagram
  ├─ Clerk authentication + board ownership check
  ├─ context sanitization + size limits
  ├─ model provider adapter
  ├─ structured-output validation
  └─ DiagramProposal JSON
          │
          ▼
client diagram compiler
  ├─ layout nodes and edges
  ├─ create Excalidraw elements
  ├─ group and select generated elements
  └─ update scene ref + mark unsaved
          │
          ▼
POST /api/workspace/:projectId
```

Keep the model provider behind an adapter, for example `lib/ai/provider.ts`, so provider changes do not leak into UI or diagram compilation. The initial provider can use a server-side structured-output API, but the client must never receive the provider secret or call the provider directly.

## Data contracts

### Board context sent to AI

Do not send the entire Excalidraw object graph by default. Convert the current scene to a bounded context:

```ts
type DiagramContext = {
  projectId: string;
  projectName: string;
  selectedText: string[];
  visibleText: string[];
  existingNodeCount: number;
  existingEdgeCount: number;
  requestedDiagramType?: DiagramType;
};
```

Text should be extracted from text/label elements, deduplicated, truncated per item, and capped by total characters. Binary files and arbitrary app state must never be sent to the model.

### Model output

Define a shared schema in `lib/ai/diagram-schema.ts` and validate it on the server and client. Use Zod or an equivalent validator once the dependency decision is made.

```ts
type DiagramProposal = {
  version: 1;
  title: string;
  diagramType: "mind-map" | "flowchart" | "journey" | "concept-map" | "timeline" | "matrix";
  summary: string;
  nodes: Array<{
    id: string;
    label: string;
    kind?: "root" | "step" | "decision" | "risk" | "person" | "milestone" | "note";
    group?: string;
    color?: "orange" | "yellow" | "blue" | "green" | "pink" | "neutral";
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    label?: string;
    relation?: "leads-to" | "depends-on" | "blocks" | "supports" | "part-of";
  }>;
  warnings: string[];
};
```

The server must reject unknown fields where practical, missing edge endpoints, duplicate IDs, excessive node/edge counts, oversized labels, and invalid diagram types. The compiler should also defensively skip invalid relationships rather than crashing the canvas.

## Implementation phases

### Phase 0 — Baseline and decisions

Decision record for this implementation:

- Provider: direct Gemini Developer API through a server-side provider adapter. Gemini is the recommended MVP default because its API supports JSON Schema structured output and the JavaScript SDK supports Zod schemas, which directly fits the typed diagram proposal contract. See [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output).
- Model: `gemini-3.8-flash` is the initial configurable default in [.env.example](../.env.example); keep it configurable because model availability and free-tier eligibility can change.
- Fallback: OpenRouter is supported as a second adapter with `openrouter/free` for experimentation. It can route to a compatible free model, but free variants are rate-limited and provider behavior can vary. See [OpenRouter free models](https://openrouter.ai/collections/free-models).
- Secrets: `GEMINI_API_KEY` and `OPENROUTER_API_KEY` are server-only and never prefixed with `NEXT_PUBLIC_`.
- Initial limits: 4,000 prompt characters, 12,000 context characters, 80 nodes, 120 edges, and a 30-second request timeout. These are conservative defaults and should be tuned after fixture testing.
- Cost control: `AI_MONTHLY_BUDGET_USD` is documented as a deployment guardrail; actual accounting is deferred until the provider adapter exists.
- Privacy: Gemini's free tier states that submitted content may be used to improve Google products. Do not use the free tier for confidential board content until the product's privacy requirements are accepted; this is a launch decision, not an implementation detail. See [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).

Deliverables:

- Confirm whether Gemini free-tier data-use terms are acceptable for board content; otherwise use an approved paid/privacy configuration or do not send that content.
- Add an environment variable contract for `AI_PROVIDER`, `AI_MODEL`, `AI_FALLBACK_PROVIDER`, provider-specific keys, and limits; never commit secrets.
- Keep the checked-in [.env.example](../.env.example) free of real credentials and use it as the source of truth for required AI configuration.
- Record the expected response schema and limits in code and documentation.
- Run the current lint/build baseline and capture existing failures separately from new failures.

Exit criteria: the Gemini-first recommendation, OpenRouter fallback, secret boundary, model decision, privacy caveat, and limits are documented; the app still builds before feature work begins.

### Phase 1 — Reliable board hydration and persistence

Files likely to change:

- [app/api/workspace/[projectId]/route.ts](../app/api/workspace/[projectId]/route.ts)
- [components/custom/whiteboard-component.tsx](../components/custom/whiteboard-component.tsx)
- [components/custom/workspace-view.tsx](../components/custom/workspace-view.tsx)
- [lib/boards/queries.ts](../lib/boards/queries.ts)

Work:

1. Add authenticated `GET /api/workspace/:projectId` or server-load the snapshot before the client component renders.
2. Return `{ project, snapshot }` and distinguish “no saved snapshot” from “snapshot failed to load.”
3. Let `WhiteboardComponent` accept `initialSnapshot` and only fall back to localStorage when appropriate.
4. Define a conflict policy: if localStorage is newer or marked unsynced, show **Restore local**, **Use saved**, and **Keep both** before replacing it.
5. Keep all server ownership checks scoped by both `projectId` and Clerk identity.
6. Add a stable snapshot version and `updatedAt` field before introducing AI writes, if the current schema can support it without breaking existing rows.

Exit criteria: opening a board in a new browser loads the saved scene, and a failed load cannot silently erase local work.

### Phase 2 — Diagram domain model and compiler

Add a small pure domain layer, for example:

- `lib/ai/diagram-schema.ts` — schema and limits
- `lib/ai/diagram-context.ts` — safe text extraction and truncation
- `lib/ai/diagram-layout.ts` — deterministic layout algorithms
- `lib/ai/excalidraw-compiler.ts` — proposal to Excalidraw elements
- `lib/ai/diagram-colors.ts` — controlled palette mapping

Work:

1. Compile the same proposal twice and produce the same geometry for deterministic review and tests.
2. Place a new proposal in the visible viewport center with a collision offset from existing elements.
3. Use a bounded grid/tree layout for MVP; avoid a graph library until real diagrams demonstrate the need.
4. Create text, rectangle/diamond/ellipse, and arrow elements using Excalidraw APIs/types rather than hand-copying opaque JSON from model output.
5. Use node IDs only as an internal map during compilation. Do not expose them as user-facing labels.
6. Return generated element IDs and a generated group ID so the client can select, remove, or regenerate the proposal.

Exit criteria: fixture proposals compile into valid Excalidraw scenes for all supported diagram types without model access.

### Phase 3 — Server AI endpoint

Add:

- `app/api/ai/diagram/route.ts`
- `lib/ai/provider.ts`
- `lib/ai/prompts.ts`

Request shape:

```ts
{
  projectId: string;
  prompt: string;
  context: DiagramContext;
  diagramType?: DiagramType;
}
```

Server behavior:

1. Authenticate with Clerk.
2. Validate prompt length, project ID, diagram type, and context size.
3. Verify the user owns the board.
4. Optionally compare the request context against the latest server snapshot to detect stale clients.
5. Build a system prompt that requires only the versioned proposal schema, no raw Excalidraw JSON, no HTML/SVG/JS, and no claims of certainty about missing facts.
6. Call the provider with a timeout and bounded token budget.
7. Validate and normalize the response.
8. Return a request ID, proposal, usage metadata if available, and warnings.

Error responses should distinguish authentication, ownership, invalid input, provider timeout, rate limit, malformed provider output, and internal failure. Do not return raw provider prompts, secrets, or stack traces.

### Phase 4 — Workspace AI experience

Add an `AiCanvasPanel` next to the canvas and connect it through [components/custom/workspace-view.tsx](../components/custom/workspace-view.tsx).

UX states:

- Idle: examples such as “Map the risks in this launch.”
- Generating: cancel/disable duplicate submit, show that the board is unchanged.
- Preview: title, type, summary, node/edge count, warnings, and a small textual or canvas preview.
- Apply mode: **Add to board**, **Replace selected AI group**, **Retry**, **Cancel**.
- Applied: show the generated group as selected and offer **Undo AI insertion**.
- Error: actionable message with retry and no scene mutation.

The first interaction should be contextual: selected text is preferred, then visible board text, then the user's prompt alone. The AI panel should not require navigating away from the board.

Add an AI action to [components/custom/workspace-header.tsx](../components/custom/workspace-header.tsx). Keep [app/dashboard/ai-helper/page.tsx](../app/dashboard/ai-helper/page.tsx) as a lightweight entry point that explains the feature and routes the user to a board, rather than maintaining a second incompatible AI implementation.

### Phase 5 — Apply, save, and recovery behavior

Extend the imperative whiteboard handle with operations such as:

```ts
applyProposal(proposal: DiagramProposal, mode: "add" | "replace-selection"): ApplyResult;
undoLastAiInsertion(): boolean;
getContext(): DiagramContext;
```

Rules:

- Applying a proposal updates the same `sceneRef` used by `handleChange`.
- The insertion marks the board unsynced and uses the existing manual save path.
- Never apply if the user has navigated to a different project.
- If the save fails, keep the generated elements locally and show a clear retry state.
- If the user closes the board with unsaved AI elements, reuse the existing leave confirmation.
- Store only the final Excalidraw snapshot in `whiteboardData`; do not persist prompts or model responses there unless an explicit history feature is added.

### Phase 6 — Observability, limits, and rollout

Add structured server logs with request ID, project ID hash, user ID hash, diagram type, latency, status, node count, edge count, and provider usage. Do not log prompt text or board text by default.

Add:

- Per-user and per-project rate limits
- Request timeout and maximum prompt/context size
- Maximum nodes and edges per proposal
- A feature flag for gradual release
- A kill switch when the provider is unavailable or cost exceeds the budget
- Optional usage counters in a dedicated table if billing/credits are required

Roll out internally first, then to a small percentage of users, monitoring malformed-output rate, apply rate, retry rate, latency, provider errors, and save failures.

## Proposed API surface

### `GET /api/workspace/:projectId`

Returns the authorized board and the latest snapshot, or an explicit empty snapshot. Must not reveal whether a board exists to an unauthorized user beyond the chosen 404 behavior.

### `POST /api/workspace/:projectId`

Keep the existing save contract, but add optional optimistic concurrency fields when ready:

```ts
{
  elements: unknown[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
  baseUpdatedAt?: string;
}
```

Return `409` on a detected stale write instead of silently overwriting newer server state.

### `POST /api/ai/diagram`

Returns:

```ts
{
  requestId: string;
  proposal: DiagramProposal;
  warnings: string[];
  usage?: { inputTokens?: number; outputTokens?: number };
}
```

### Optional later APIs

- `POST /api/ai/diagram/:requestId/feedback` for accepted/rejected quality feedback
- `GET /api/workspace/:projectId/ai-history` for explicit generation history
- `POST /api/workspace/:projectId/ai-history/:id/restore` for restoring a prior proposal

Do not add these until the MVP proves that users need persistent AI history.

## Security and privacy requirements

- Provider keys exist only in server environment variables.
- Every AI request checks Clerk authentication and board ownership on the server.
- Treat board text as user content, not instructions. Delimit it in the prompt and ignore instructions embedded in board text.
- Send only the minimum text needed for the request; never send binary files or full app state.
- Enforce body-size, prompt-length, node-count, edge-count, timeout, and rate limits.
- Sanitize model output through schema validation; never render model-provided HTML, CSS, SVG, URLs, or executable code.
- Avoid logging raw prompts, board text, email addresses, or provider secrets.
- Document provider retention/training settings and give users an appropriate notice before launch.
- If credit accounting is introduced, decrement credits only after a successful provider response and use an idempotent request ID.

## Testing strategy

### Unit tests

- Context extraction excludes binary files and truncates deterministically.
- Every valid fixture proposal compiles into valid Excalidraw elements.
- Invalid node IDs, dangling edges, duplicate IDs, oversized labels, and unsupported types are rejected.
- Layout is deterministic and does not overlap nodes beyond the configured tolerance.
- Apply/undo changes only the intended generated elements.

### API tests

- Unauthenticated requests return `401`.
- A user cannot request or save another user's project.
- Invalid JSON and oversized input return `400`.
- Provider timeout, rate limit, malformed output, and success responses map to stable status codes.
- Provider keys are not present in client bundles or response bodies.

### Browser/E2E tests

- A saved board hydrates in a fresh browser.
- Local unsynced data triggers the conflict choice instead of being overwritten.
- AI generation leaves the canvas unchanged until approval.
- Add-to-board creates a visible, selected diagram and marks the workspace unsaved.
- Failed save keeps generated content and allows retry.
- Leave confirmation works after AI insertion.
- Dark mode, narrow viewport, keyboard focus, loading, and error states are usable.

### Manual acceptance checklist

- Prompt: “Create a flowchart for onboarding a new customer.”
- Prompt with selected text only.
- Prompt with no existing board content.
- Prompt containing instructions attempting to make the model reveal secrets.
- Malformed or slow provider response.
- Board with many existing elements and an occupied viewport.
- Browser refresh before save and after save.
- Two tabs editing the same board, once optimistic concurrency is enabled.

## Suggested file plan

```text
app/api/ai/diagram/route.ts              # authenticated generation endpoint
lib/ai/diagram-schema.ts                 # versioned request/response validation
lib/ai/diagram-context.ts                # safe scene-to-context projection
lib/ai/diagram-layout.ts                 # deterministic layouts
lib/ai/excalidraw-compiler.ts            # proposal -> Excalidraw elements
lib/ai/provider.ts                       # provider-neutral server adapter
lib/ai/prompts.ts                        # system prompt and output rules
components/custom/ai-canvas-panel.tsx    # prompt, preview, apply states
components/custom/diagram-preview.tsx    # proposal summary/preview
tests/ai/diagram-layout.test.ts          # pure layout tests
tests/ai/excalidraw-compiler.test.ts     # compiler fixtures
tests/api/ai-diagram.test.ts             # auth/validation/provider tests
docs/AI-CANVAS-IMPLEMENTATION-PLAN.md    # this plan
```

Exact filenames may change to match the repository's test conventions, but the boundaries should remain: server generation, typed domain model, deterministic compiler, and workspace integration.

## Definition of done for MVP

- A signed-in user can generate one of the supported diagram types from the current board context.
- The model response is schema validated and cannot directly execute or inject arbitrary canvas data.
- The user must approve the proposal before the scene changes.
- Generated elements are placed deterministically, selected, undoable, and saved with the existing workspace snapshot.
- Existing saved boards hydrate correctly and unsynced local work is protected.
- Ownership, rate limits, size limits, timeouts, and provider errors are handled.
- Unit, API, and browser tests cover success, failure, privacy, and recovery paths.
- Feature flag and observability are in place before enabling the feature for general users.

## Recommended delivery order

Implement in this order: Phase 0, Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, then Phase 6. Phase 2 should be completed with fixture data before connecting a real model. That keeps the risky part—the model response—isolated from canvas correctness and makes the feature testable even when the provider is unavailable.

## Open decisions before coding

1. Are Gemini free-tier data-use terms acceptable for the board content, or should the implementation use an approved paid/privacy configuration?
2. Should AI be available only to board owners initially, or to future collaborators as well?
3. Should generated diagrams use the existing Excalidraw palette or a Clariose-specific palette?
4. Is persistent prompt/generation history required, or is the current board snapshot enough?
5. Should the current last-write-wins save behavior be upgraded to optimistic concurrency before launch?
6. Are board contents permitted to leave the deployment region, and what retention/training policy must be disclosed?

