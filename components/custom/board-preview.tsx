"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type {
  ExcalidrawInitialDataState,
  ExcalidrawImperativeAPI,
  NormalizedZoomValue,
} from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import { useTheme } from "next-themes";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((module) => module.Excalidraw),
  { ssr: false },
);

type BoardPreviewProps = {
  elements: unknown;
  appState: unknown;
  files: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function BoardPreview({
  elements,
  appState,
  files,
}: BoardPreviewProps) {
  const [initialData, setInitialData] =
    React.useState<ExcalidrawInitialDataState | null>(null);
  const [excalidrawApi, setExcalidrawApi] =
    React.useState<ExcalidrawImperativeAPI | null>(null);
  const { resolvedTheme } = useTheme();

  const canvasTheme = resolvedTheme === "dark" ? "dark" : "light";
  const canvasViewBackgroundColor =
    canvasTheme === "dark" ? "#ffffff" : "#f8f7f4";
  const canvasSurfaceColor =
    canvasTheme === "dark" ? "#1f1f1f" : "#f8f7f4";

  React.useEffect(() => {
    excalidrawApi?.updateScene({
      appState: {
        theme: canvasTheme,
        viewBackgroundColor: canvasViewBackgroundColor,
      },
    });
  }, [canvasTheme, canvasViewBackgroundColor, excalidrawApi]);

  React.useEffect(() => {
    let isCurrent = true;

    async function restoreBoard() {
      if (!Array.isArray(elements)) {
        setInitialData({ elements: [], appState: {}, files: {} });
        return;
      }

      try {
        const { restore } = await import("@excalidraw/excalidraw");
        const savedAppState = isRecord(appState) ? appState : {};
        const safeAppState = {
          ...savedAppState,
          collaborators: Array.isArray(savedAppState.collaborators)
            ? savedAppState.collaborators
            : [],
        };
        const safeFiles = isRecord(files) ? files : {};
        const restored = restore(
          JSON.parse(
            JSON.stringify({
              elements,
              appState: safeAppState,
              files: safeFiles,
            }),
          ),
          null,
          null,
        );
        if (isCurrent) {
          setInitialData(restored);
        }
      } catch (error) {
        console.error("Unable to render the board preview.", error);
      }
    }

    void restoreBoard();

    return () => {
      isCurrent = false;
    };
  }, [appState, elements, files]);

  if (!initialData) {
    return (
      <div className="grid h-full place-items-center bg-[#f3f0ea] text-xs text-[#9b9489]" aria-label="Loading board preview">
        Loading preview...
      </div>
    );
  }

  return (
    <div
      className="board-preview pointer-events-none h-full overflow-hidden bg-[#f8f7f4]"
      style={{ backgroundColor: canvasSurfaceColor }}
    >
      <Excalidraw
        key={canvasTheme}
        initialData={{
          ...initialData,
          appState: {
            ...initialData.appState,
            theme: canvasTheme,
            viewBackgroundColor: canvasViewBackgroundColor,
            zoom: { value: 0.5 as NormalizedZoomValue },
          },
        }}
        excalidrawAPI={setExcalidrawApi}
        theme={canvasTheme}
        viewModeEnabled
        UIOptions={{ canvasActions: { changeViewBackgroundColor: false } }}
        zenModeEnabled
      />
    </div>
  );
}
