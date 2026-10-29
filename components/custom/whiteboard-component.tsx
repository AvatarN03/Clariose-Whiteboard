"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  restore,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
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
    try {
      const savedScene = localStorage.getItem(storageKey);
      if (savedScene) {
        const restored = restore(JSON.parse(savedScene), null, null);
        sceneRef.current = restored;
        hasUnsyncedChangesRef.current =
          localStorage.getItem(syncedStorageKey) !== "true";
        setInitialData(restored);
        return;
      }
    } catch (error) {
      console.error("Unable to restore the locally saved whiteboard.", error);
    }

    const blankScene: ExcalidrawInitialDataState = {
      appState: {
        viewBackgroundColor: "#f8f7f4",
        name: `whiteboard-${projectId}`,
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

  function handleChange(
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) {
    sceneRef.current = { elements, appState, files };
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

  if (!initialData) {
    return (
      <section className="relative min-h-[calc(100vh-3.5rem)] flex-1 overflow-hidden bg-[#f8f7f4]" />
    );
  }

  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] flex-1 overflow-hidden bg-[#f8f7f4]">
      <div className="absolute inset-0">
        <Excalidraw
          initialData={initialData}
          onChange={handleChange}
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: false,
              clearCanvas: true,
              loadScene: false,
              saveToActiveFile: false,
              toggleTheme: true,
            },
          }}
        />
      </div>
    </section>
  );
});
