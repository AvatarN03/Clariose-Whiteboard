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
  Type,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((module) => module.Excalidraw),
  { ssr: false },
);

type WhiteboardComponentProps = {
  projectId: string;
};

export type WhiteboardComponentHandle = {
  save: () => boolean;
  getSnapshot: () => SceneSnapshot | null;
  hasUnsyncedChanges: () => boolean;
  markSynced: () => void;
  discard: () => void;
};

export type SceneSnapshot = {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
};

const drawingTools: Array<{
  type: Exclude<ToolType, "image"> | "image";
  label: string;
  shortcut: string;
  icon: typeof MousePointer2;
}> = [
  { type: "selection", label: "Select", shortcut: "V", icon: MousePointer2 },
  { type: "rectangle", label: "Rectangle", shortcut: "R", icon: Square },
  { type: "diamond", label: "Diamond", shortcut: "D", icon: Diamond },
  { type: "ellipse", label: "Ellipse", shortcut: "O", icon: Circle },
  { type: "arrow", label: "Arrow", shortcut: "A", icon: ArrowDownRight },
  { type: "line", label: "Line", shortcut: "L", icon: Minus },
  { type: "freedraw", label: "Draw", shortcut: "P", icon: Pencil },
  { type: "text", label: "Text", shortcut: "T", icon: Type },
  { type: "image", label: "Image", shortcut: "9", icon: Image },
  { type: "eraser", label: "Eraser", shortcut: "E", icon: Eraser },
  { type: "hand", label: "Hand", shortcut: "H", icon: Hand },
];

export const WhiteboardComponent = React.forwardRef<
  WhiteboardComponentHandle,
  WhiteboardComponentProps
>(function WhiteboardComponent({ projectId }, ref) {
  const storageKey = `whiteboard-scene:${projectId}`;
  const [initialData, setInitialData] =
    React.useState<ExcalidrawInitialDataState | null>(null);
  const sceneRef = React.useRef<SceneSnapshot | null>(null);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUnsyncedChangesRef = React.useRef(false);
  const syncedStorageKey = `${storageKey}:synced`;
  const [excalidrawApi, setExcalidrawApi] =
    React.useState<ExcalidrawImperativeAPI | null>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const resolvedThemeRef = React.useRef(resolvedTheme);
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
          ...scene.appState,
          theme: canvasTheme,
          viewBackgroundColor: canvasViewBackgroundColor,
        },
        files: scene.files,
      };
    },
    [canvasTheme, canvasViewBackgroundColor, initialData],
  );

  React.useEffect(() => {
    resolvedThemeRef.current = resolvedTheme;
  }, [resolvedTheme]);

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

    try {
      const savedScene = localStorage.getItem(storageKey);
      if (savedScene) {
        const restored = restore(JSON.parse(savedScene), null, null);
        const normalizedRestored = {
          ...restored,
          appState: {
            ...restored.appState,
            theme: initialCanvasTheme,
            viewBackgroundColor: initialCanvasBackgroundColor,
            zoom: { value: 0.5 as NormalizedZoomValue },
          },
        };
        sceneRef.current = normalizedRestored;
        hasUnsyncedChangesRef.current =
          localStorage.getItem(syncedStorageKey) !== "true";
        setInitialData(normalizedRestored);
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
  }, [projectId, storageKey, syncedStorageKey]);

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

  React.useImperativeHandle(
    ref,
    () => ({
      save: saveScene,
      getSnapshot: () => sceneRef.current,
      hasUnsyncedChanges: () => hasUnsyncedChangesRef.current,
      markSynced: handleMarkSynced,
      discard: handleDiscard,
    }),
    [handleDiscard, handleMarkSynced, saveScene],
  );

  if (!themedInitialData) {
    return (
      <section className="relative h-[calc(100dvh-3.5rem)] min-h-0 flex-1 overflow-hidden bg-background" />
    );
  }

  return (
    <section
      className="workspace-whiteboard relative h-[calc(100dvh-3.5rem)] min-h-0 flex-1 overflow-hidden bg-background"
      style={{ backgroundColor: canvasSurfaceColor }}
    >
      <TooltipProvider>
        <aside
          aria-label="Whiteboard tools"
          className="whiteboard-custom-toolbar absolute left-2 right-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-row gap-1 overflow-x-auto rounded-xl border border-border bg-card/95 p-1.5 shadow-sm backdrop-blur-sm md:left-auto md:right-4 md:top-1/2 md:max-w-none md:-translate-y-1/2 md:flex-col"
        >
          {drawingTools.map(({ type, label, shortcut, icon: Icon }) => (
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
              <TooltipContent side="left">
                {label}
                <Kbd>{shortcut}</Kbd>
              </TooltipContent>
            </Tooltip>
          ))}
        </aside>
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
  );
});
