"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import {
  restore,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawInitialDataState,
  ExcalidrawImperativeAPI,
  NormalizedZoomValue,
  ToolType,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { compileDiagramProposal } from "@/lib/ai/excalidraw-compiler";
import { createDiagramContext, type DiagramContext } from "@/lib/ai/diagram-context";
import type { DiagramProposal } from "@/lib/ai/diagram-schema";
import {
  ArrowDownRight,
  Circle,
  Diamond,
  Eraser,
  Hand,
  Image,
  Minus,
  MousePointer2,
  Pencil,
  Square,
  Sparkles,
  Type,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((module) => module.Excalidraw),
  { ssr: false },
);

type WhiteboardComponentProps = {
  projectId: string;
  projectName: string;
  initialSnapshot?: SceneSnapshot | null;
  initialSnapshotUpdatedAt?: string | null;
  onOpenAi: () => void;
  readOnly?: boolean;
};

export type ApplyProposalResult =
  | { success: true; generatedElementIds: string[]; generatedGroupId: string; removedElementIds: string[] }
  | { success: false; error: string };

export type WhiteboardComponentHandle = {
  save: () => boolean;
  getSnapshot: () => SceneSnapshot | null;
  hasUnsyncedChanges: () => boolean;
  markSynced: () => void;
  discard: () => void;
  getContext: () => DiagramContext | null;
  applyProposal: (proposal: DiagramProposal, mode: "add" | "replace-selection") => ApplyProposalResult;
  undoLastAiInsertion: () => boolean;
  replaceSnapshot: (snapshot: SceneSnapshot) => void;
};

export type SceneSnapshot = {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
};

function normalizeAppState(appState: Partial<AppState>): Partial<AppState> {
  // JSON snapshots can turn Excalidraw's collaborators Map into an object.
  // Excalidraw calls forEach on it during initialization, so always restore a
  // Map at the application boundary.
  const collaborators = appState.collaborators;
  const normalizedCollaborators =
    collaborators instanceof Map
      ? collaborators
      : Array.isArray(collaborators)
        ? new Map(collaborators)
        : new Map();

  return { ...appState, collaborators: normalizedCollaborators };
}

type WhiteboardTool = {
  type: Exclude<ToolType, "image"> | "image";
  label: string;
  shortcut: string;
  icon: typeof MousePointer2;
};

const utilityTools: WhiteboardTool[] = [
  { type: "selection", label: "Select", shortcut: "V", icon: MousePointer2 },
  { type: "hand", label: "Hand", shortcut: "H", icon: Hand },
  { type: "freedraw", label: "Draw", shortcut: "P", icon: Pencil },
  { type: "eraser", label: "Eraser", shortcut: "E", icon: Eraser },
];

const drawingTools: WhiteboardTool[] = [
  { type: "rectangle", label: "Rectangle", shortcut: "R", icon: Square },
  { type: "diamond", label: "Diamond", shortcut: "D", icon: Diamond },
  { type: "ellipse", label: "Ellipse", shortcut: "O", icon: Circle },
  { type: "arrow", label: "Arrow", shortcut: "A", icon: ArrowDownRight },
  { type: "line", label: "Line", shortcut: "L", icon: Minus },
  { type: "text", label: "Text", shortcut: "T", icon: Type },
  { type: "image", label: "Image", shortcut: "9", icon: Image },
];

export const WhiteboardComponent = React.forwardRef<
  WhiteboardComponentHandle,
  WhiteboardComponentProps
>(function WhiteboardComponent(
  { projectId, projectName, initialSnapshot, initialSnapshotUpdatedAt, onOpenAi, readOnly = false },
  ref,
) {
  const storageKey = `whiteboard-scene:${projectId}`;
  const [initialData, setInitialData] =
    React.useState<ExcalidrawInitialDataState | null>(null);
  const sceneRef = React.useRef<SceneSnapshot | null>(null);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUnsyncedChangesRef = React.useRef(false);
  const lastAiInsertionRef = React.useRef<{
    generatedElementIds: Set<string>;
    removedElements: ExcalidrawElement[];
    previousSelectedElementIds: AppState["selectedElementIds"];
    previousSelectedGroupIds: AppState["selectedGroupIds"];
  } | null>(null);
  const syncedStorageKey = `${storageKey}:synced`;
  const [conflict, setConflict] = React.useState<{
    local: SceneSnapshot;
    saved: SceneSnapshot;
  } | null>(null);
  const [excalidrawApi, setExcalidrawApi] =
    React.useState<ExcalidrawImperativeAPI | null>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const resolvedThemeRef = React.useRef(resolvedTheme);
  const [isMobile, setIsMobile] = React.useState(false);
  const [activeTool, setActiveTool] =
    React.useState<AppState["activeTool"]["type"]>("selection");
  const canvasTheme = resolvedTheme === "dark" ? "dark" : "light";
  // Excalidraw inverts its canvas in dark mode. The internal canvas must
  // therefore start light so the renderer produces the intended dark surface.
  const canvasViewBackgroundColor =
    canvasTheme === "dark" ? "#ffffff" : "#f8f7f4";
  const canvasSurfaceColor =
    canvasTheme === "dark" ? "#1f1f1f" : "#f8f7f4";
  const themedInitialData = React.useMemo<ExcalidrawInitialDataState | null>(
    () => {
      const scene = sceneRef.current ?? initialData;
      if (!scene) {
        return null;
      }

      return {
        elements: scene.elements,
        appState: {
          ...normalizeAppState(scene.appState ?? {}),
          theme: canvasTheme,
          viewBackgroundColor: canvasViewBackgroundColor,
          viewModeEnabled: readOnly,
        },
        files: scene.files,
      };
    },
    [canvasTheme, canvasViewBackgroundColor, initialData, readOnly],
  );

  React.useEffect(() => {
    resolvedThemeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => setIsMobile(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  const saveScene = React.useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) {
      return false;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    try {
      localStorage.setItem(
        storageKey,
        serializeAsJSON(scene.elements, scene.appState, scene.files, "local"),
      );
      localStorage.setItem(`${storageKey}:updated-at`, new Date().toISOString());
      return true;
    } catch (error) {
      console.error("Unable to save the whiteboard locally.", error);
      return false;
    }
  }, [storageKey]);

  React.useEffect(() => {
    const initialCanvasTheme: "dark" | "light" =
      resolvedThemeRef.current === "dark" ? "dark" : "light";
    const initialCanvasBackgroundColor =
      initialCanvasTheme === "dark" ? "#ffffff" : "#f8f7f4";

    const normalizeScene = (scene: SceneSnapshot): SceneSnapshot => ({
      elements: scene.elements,
      appState: {
        ...normalizeAppState(scene.appState),
        theme: initialCanvasTheme,
        viewBackgroundColor: initialCanvasBackgroundColor,
        zoom: { value: 0.5 as NormalizedZoomValue },
      },
      files: scene.files,
    });

    try {
      const savedScene = localStorage.getItem(storageKey);
      if (savedScene) {
        const restored = restore(JSON.parse(savedScene), null, null);
        const localSnapshot = normalizeScene(restored);
        const localUpdatedAt = localStorage.getItem(`${storageKey}:updated-at`);
        const localIsNewer =
          Boolean(initialSnapshotUpdatedAt) &&
          Boolean(localUpdatedAt) &&
          localUpdatedAt! > initialSnapshotUpdatedAt!;
        const localIsUnsynced =
          localStorage.getItem(syncedStorageKey) !== "true";

        if (initialSnapshot && (localIsUnsynced || localIsNewer)) {
          setConflict({ local: localSnapshot, saved: initialSnapshot });
          return;
        }

        if (initialSnapshot) {
          const normalizedSaved = normalizeScene(initialSnapshot);
          sceneRef.current = normalizedSaved;
          hasUnsyncedChangesRef.current = false;
          setInitialData(normalizedSaved);
          return;
        }

        sceneRef.current = localSnapshot;
        hasUnsyncedChangesRef.current = localIsUnsynced;
        setInitialData(localSnapshot);
        return;
      }

      if (initialSnapshot) {
        const normalizedSaved = normalizeScene(initialSnapshot);
        sceneRef.current = normalizedSaved;
        hasUnsyncedChangesRef.current = false;
        setInitialData(normalizedSaved);
        return;
      }
    } catch (error) {
      console.error("Unable to restore the locally saved whiteboard.", error);
    }

    const blankScene: ExcalidrawInitialDataState = {
      appState: {
        theme: initialCanvasTheme,
        viewBackgroundColor: initialCanvasBackgroundColor,
        name: `whiteboard-${projectId}`,
        zoom: { value: 0.5 as NormalizedZoomValue },
      },
    };
    sceneRef.current = {
      elements: [],
      appState: blankScene.appState ?? {},
      files: {},
    };
    hasUnsyncedChangesRef.current = false;
    setInitialData(blankScene);
  }, [
    initialSnapshot,
    initialSnapshotUpdatedAt,
    projectId,
    storageKey,
    syncedStorageKey,
  ]);

  React.useEffect(
    () => () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveScene();
    },
    [saveScene],
  );

  React.useEffect(() => {
    if (!excalidrawApi) {
      return;
    }

    excalidrawApi.updateScene({
      appState: {
        theme: canvasTheme,
        viewBackgroundColor: canvasViewBackgroundColor,
      },
    });
  }, [canvasTheme, canvasViewBackgroundColor, excalidrawApi]);

  function handleChange(
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) {
    sceneRef.current = { elements, appState, files };
    setActiveTool(appState.activeTool.type);

    // Excalidraw has its own theme menu. Keep it connected to the app theme
    // so either theme control updates the same source of truth.
    if (
      (appState.theme === "dark" || appState.theme === "light") &&
      appState.theme !== resolvedThemeRef.current
    ) {
      setTheme(appState.theme);
    }

    hasUnsyncedChangesRef.current = true;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveScene();
      saveTimerRef.current = null;
    }, 5000);
  }

  const handleMarkSynced = React.useCallback(() => {
    try {
      localStorage.setItem(syncedStorageKey, "true");
      hasUnsyncedChangesRef.current = false;
    } catch (error) {
      console.error("Unable to mark the whiteboard as synced.", error);
    }
  }, [syncedStorageKey]);

  const handleDiscard = React.useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(syncedStorageKey);
      hasUnsyncedChangesRef.current = false;
    } catch (error) {
      console.error("Unable to discard the local whiteboard.", error);
    }
  }, [storageKey, syncedStorageKey]);

  const getContext = React.useCallback((): DiagramContext | null => {
    const scene = sceneRef.current;
    if (!scene) return null;
    const selectedElementIds = scene.appState.selectedElementIds ?? {};
    const selectedElements = scene.elements.filter((element) => Boolean(selectedElementIds[element.id]));
    return createDiagramContext({
      projectId,
      projectName,
      elements: scene.elements,
      selectedElements,
    });
  }, [projectId, projectName]);

  const applyProposal = React.useCallback(
    (proposal: DiagramProposal, mode: "add" | "replace-selection"): ApplyProposalResult => {
      const scene = sceneRef.current;
      if (!scene) return { success: false, error: "The whiteboard is not ready yet." };

      const selectedElementIds = scene.appState.selectedElementIds ?? {};
      const selectedAiGroupIds = new Set(
        scene.elements
          .filter((element) => Boolean(selectedElementIds[element.id]))
          .map((element) => {
            const data = element.customData;
            return data && typeof data === "object" && typeof data.aiGroupId === "string" ? data.aiGroupId : null;
          })
          .filter((groupId): groupId is string => Boolean(groupId)),
      );

      if (mode === "replace-selection" && selectedAiGroupIds.size === 0) {
        return { success: false, error: "Select an existing AI-generated group to replace it." };
      }

      const removedElements = mode === "replace-selection"
        ? scene.elements.filter((element) => {
            const data = element.customData;
            return data && typeof data === "object" && typeof data.aiGroupId === "string" && selectedAiGroupIds.has(data.aiGroupId);
          })
        : [];
      const removedIds = new Set(removedElements.map((element) => element.id));
      const baseElements = scene.elements.filter((element) => !removedIds.has(element.id));
      const appState = excalidrawApi?.getAppState() ?? scene.appState;
      const zoom = typeof appState.zoom?.value === "number" && appState.zoom.value > 0 ? appState.zoom.value : 1;
      const compiled = compileDiagramProposal(proposal, {
        viewport: {
          x: -(appState.scrollX ?? 0),
          y: -(appState.scrollY ?? 0),
          width: (appState.width ?? 1200) / zoom,
          height: (appState.height ?? 800) / zoom,
        },
        existingElements: baseElements,
      });

      if (compiled.elements.length === 0) return { success: false, error: "The proposal did not contain any drawable elements." };

      const nextElements = [...baseElements, ...compiled.elements];
      const nextSelectedElementIds = Object.fromEntries(compiled.elements.map((element) => [element.id, true])) as AppState["selectedElementIds"];
      const nextSelectedGroupIds = { [compiled.generatedGroupId]: true } as AppState["selectedGroupIds"];
      sceneRef.current = {
        elements: nextElements,
        appState: {
          ...scene.appState,
          selectedElementIds: nextSelectedElementIds,
          selectedGroupIds: nextSelectedGroupIds,
        },
        files: scene.files,
      };
      lastAiInsertionRef.current = {
        generatedElementIds: new Set(compiled.generatedElementIds),
        removedElements,
        previousSelectedElementIds: scene.appState.selectedElementIds ?? {},
        previousSelectedGroupIds: scene.appState.selectedGroupIds ?? {},
      };
      hasUnsyncedChangesRef.current = true;
      excalidrawApi?.updateScene({
        elements: nextElements,
        appState: {
          selectedElementIds: nextSelectedElementIds,
          selectedGroupIds: nextSelectedGroupIds,
        },
      });
      saveScene();
      return {
        success: true,
        generatedElementIds: compiled.generatedElementIds,
        generatedGroupId: compiled.generatedGroupId,
        removedElementIds: [...removedIds],
      };
    },
    [excalidrawApi, saveScene],
  );

  const undoLastAiInsertion = React.useCallback(() => {
    const scene = sceneRef.current;
    const lastInsertion = lastAiInsertionRef.current;
    if (!scene || !lastInsertion) return false;

    const generatedIds = lastInsertion.generatedElementIds;
    const currentIds = new Set(scene.elements.map((element) => element.id));
    const restoredElements = lastInsertion.removedElements.filter((element) => !currentIds.has(element.id));
    const nextElements = [...scene.elements.filter((element) => !generatedIds.has(element.id)), ...restoredElements];
    sceneRef.current = {
      elements: nextElements,
      appState: {
        ...scene.appState,
        selectedElementIds: lastInsertion.previousSelectedElementIds,
        selectedGroupIds: lastInsertion.previousSelectedGroupIds,
      },
      files: scene.files,
    };
    hasUnsyncedChangesRef.current = true;
    excalidrawApi?.updateScene({
      elements: nextElements,
      appState: {
        selectedElementIds: lastInsertion.previousSelectedElementIds,
        selectedGroupIds: lastInsertion.previousSelectedGroupIds,
      },
    });
    lastAiInsertionRef.current = null;
    saveScene();
    return true;
  }, [excalidrawApi, saveScene]);

  const resolveConflict = React.useCallback(
    (choice: "local" | "saved" | "both") => {
      if (!conflict) {
        return;
      }

      if (choice === "local") {
        sceneRef.current = conflict.local;
        hasUnsyncedChangesRef.current = true;
        setInitialData(conflict.local);
      } else {
        if (choice === "both") {
          localStorage.setItem(
            `${storageKey}:local-copy`,
            serializeAsJSON(
              conflict.local.elements,
              conflict.local.appState,
              conflict.local.files,
              "local",
            ),
          );
        }
        sceneRef.current = conflict.saved;
        hasUnsyncedChangesRef.current = false;
        setInitialData(conflict.saved);
        saveScene();
        handleMarkSynced();
      }

      setConflict(null);
    },
    [conflict, handleMarkSynced, saveScene, storageKey],
  );

  React.useImperativeHandle(
    ref,
    () => ({
      save: saveScene,
      getSnapshot: () => sceneRef.current,
      hasUnsyncedChanges: () => hasUnsyncedChangesRef.current,
      markSynced: handleMarkSynced,
      discard: handleDiscard,
      getContext,
      applyProposal,
      undoLastAiInsertion,
      replaceSnapshot: (snapshot) => {
        sceneRef.current = snapshot;
        hasUnsyncedChangesRef.current = false;
        setInitialData(snapshot);
        excalidrawApi?.updateScene({
          elements: snapshot.elements,
          appState: {
            ...normalizeAppState(snapshot.appState),
            viewModeEnabled: readOnly,
          },
          files: snapshot.files,
        });
      },
    }),
    [applyProposal, excalidrawApi, getContext, handleDiscard, handleMarkSynced, readOnly, saveScene, undoLastAiInsertion],
  );

  const conflictDialog = (
    <AlertDialog open={Boolean(conflict)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Choose which whiteboard to restore</AlertDialogTitle>
          <AlertDialogDescription>
            This browser has local changes that are newer than the saved board
            or have not been synced yet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => resolveConflict("local")}>
            Restore local
          </AlertDialogAction>
          <AlertDialogAction onClick={() => resolveConflict("saved")}>
            Use saved
          </AlertDialogAction>
          <AlertDialogAction onClick={() => resolveConflict("both")}>
            Keep both
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderTool = ({ type, label, shortcut, icon: Icon }: WhiteboardTool) => (
    <Tooltip key={type}>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            aria-pressed={activeTool === type}
            className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors ${
              activeTool === type
                ? "bg-[#1d1d1b] text-white"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
            onClick={() => {
              excalidrawApi?.setActiveTool({
                type,
                ...(type === "image"
                  ? { insertOnCanvasDirectly: false }
                  : {}),
              });
            }}
          />
        }
      >
        <Icon className="size-4" />
      </TooltipTrigger>
      <TooltipContent side={isMobile ? "top" : "left"}>
        {label}
        <Kbd>{shortcut}</Kbd>
      </TooltipContent>
    </Tooltip>
  );

  if (!themedInitialData) {
    return (
      <>
        {conflictDialog}
        <section className="relative h-[calc(100dvh-3.5rem)] min-h-0 flex-1 overflow-hidden bg-background" />
      </>
    );
  }

  return (
    <>
      {conflictDialog}
      <section
        className="workspace-whiteboard relative h-[calc(100dvh-3.5rem)] min-h-0 flex-1 overflow-hidden bg-background"
        style={{ backgroundColor: canvasSurfaceColor }}
      >
      <TooltipProvider>
        {!readOnly ? <button
          type="button"
          onClick={onOpenAi}
          className="absolute bottom-4 left-4 z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#ec6338]/40 bg-card/95 px-3 py-2 text-xs font-medium text-[#c84d29] shadow-sm backdrop-blur-sm transition-colors hover:bg-[#ec6338]/10 dark:text-[#ff9b7d]"
        >
          <Sparkles className="size-3.5" aria-hidden="true" />
          AI
        </button> : null}
        {!readOnly ? <aside
          aria-label="Utility tools"
          className="whiteboard-utility-toolbar absolute bottom-4 right-2 z-10 flex flex-row gap-1 rounded-xl border border-border bg-card/95 p-1.5 shadow-sm backdrop-blur-sm md:bottom-auto md:left-4 md:right-auto md:top-1/2 md:-translate-y-1/2 md:flex-col"
        >
          {utilityTools.map(renderTool)}
        </aside> : null}
        {!readOnly ? <aside
          aria-label="Drawing tools"
          className="whiteboard-custom-toolbar absolute left-1/2 top-2 z-10 flex w-fit max-w-[calc(100%-1rem)] -translate-x-1/2 flex-row gap-1 overflow-x-auto rounded-xl border border-border bg-card/95 p-1.5 shadow-sm backdrop-blur-sm md:left-auto md:right-4 md:top-1/2 md:max-w-none md:translate-x-0 md:-translate-y-1/2 md:flex-col"
        >
          {drawingTools.map(renderTool)}
        </aside> : null}
      </TooltipProvider>
      <div className="absolute inset-0">
        <Excalidraw
          key={`${projectId}:${canvasTheme}`}
          initialData={themedInitialData}
          theme={canvasTheme}
          onChange={handleChange}
          excalidrawAPI={setExcalidrawApi}
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: false,
              clearCanvas: true,
              loadScene: false,
              saveToActiveFile: false,
              toggleTheme: false,
            },
          }}
        />
      </div>
      </section>
    </>
  );
});
