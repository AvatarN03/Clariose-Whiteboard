"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DocsComponent,
  type DocsComponentHandle,
} from "@/components/custom/docs-component";
import { AiCanvasPanel } from "@/components/custom/ai-canvas-panel";
import type { DiagramContext } from "@/lib/ai/diagram-context";
import type {
  WhiteboardComponentHandle,
  ApplyProposalResult,
  SceneSnapshot,
} from "@/components/custom/whiteboard-component";
import type { DiagramProposal } from "@/lib/ai/diagram-schema";
import {
  WorkspaceHeader,
  type WorkspaceTab,
} from "@/components/custom/workspace-header";

const WhiteboardComponent = dynamic(
  () =>
    import("@/components/custom/whiteboard-component").then(
      (module) => module.WhiteboardComponent,
    ),
  { ssr: false },
);

type WorkspaceViewProps = {
  projectId: string;
  initialTab?: WorkspaceTab;
  shareToken?: string;
};

export function WorkspaceView({
  projectId,
  initialTab = "whiteboard",
  shareToken,
}: WorkspaceViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] =
    React.useState<WorkspaceTab>(initialTab);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAiOpen, setIsAiOpen] = React.useState(false);
  const [loadState, setLoadState] = React.useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [initialSnapshot, setInitialSnapshot] =
    React.useState<SceneSnapshot | null>(null);
  const [initialSnapshotUpdatedAt, setInitialSnapshotUpdatedAt] =
    React.useState<string | null>(null);
  const [initialSnapshotVersion, setInitialSnapshotVersion] = React.useState<number | null>(null);
  const [projectName, setProjectName] = React.useState("Untitled board");
  const [actualProjectId, setActualProjectId] = React.useState(projectId);
  const [permission, setPermission] = React.useState<"viewer" | "editor">("editor");
  const [loadAttempt, setLoadAttempt] = React.useState(0);
  const [isDocsSaving, setIsDocsSaving] = React.useState(false);
  const whiteboardRef = React.useRef<WhiteboardComponentHandle>(null);
  const docsRef = React.useRef<DocsComponentHandle>(null);
  const apiUrl = shareToken ? `/api/shared/${shareToken}` : `/api/workspace/${projectId}`;

  React.useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setLoadState("loading");
      try {
        const response = await fetch(apiUrl, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Workspace request failed with ${response.status}`);
        }

        const data = (await response.json()) as {
          project?: { projectId?: string; projectName?: string };
          permission?: "viewer" | "editor";
          snapshot: (SceneSnapshot & {
            updatedAt: string;
            snapshotVersion: number;
          }) | null;
        };

        if (cancelled) {
          return;
        }

        setInitialSnapshot(data.snapshot);
        setInitialSnapshotUpdatedAt(data.snapshot?.updatedAt ?? null);
        setInitialSnapshotVersion(data.snapshot?.snapshotVersion ?? null);
        setProjectName(data.project?.projectName || "Untitled board");
        setActualProjectId(data.project?.projectId || projectId);
        setPermission(data.permission ?? "editor");
        setLoadState("ready");
      } catch (error) {
        if (!cancelled) {
          console.error("Unable to load the workspace.", error);
          setLoadState("error");
        }
      }
    }

    void loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, loadAttempt, projectId]);

  React.useEffect(() => {
    if (loadState !== "ready" || !shareToken) return;
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(apiUrl, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          snapshot: (SceneSnapshot & { updatedAt: string; snapshotVersion: number }) | null;
        };
        const current = data.snapshot;
        if (
          current &&
          current.updatedAt !== initialSnapshotUpdatedAt &&
          !whiteboardRef.current?.hasUnsyncedChanges()
        ) {
          whiteboardRef.current?.replaceSnapshot(current);
          setInitialSnapshotUpdatedAt(current.updatedAt);
          setInitialSnapshotVersion(current.snapshotVersion);
        }
      } catch (error) {
        console.error("Unable to synchronize the shared whiteboard.", error);
      }
    }, 2000);
    return () => window.clearInterval(interval);
  }, [apiUrl, initialSnapshotUpdatedAt, loadState, shareToken]);

  const saveWhiteboard = React.useCallback(async () => {
    const snapshot = whiteboardRef.current?.getSnapshot();
    if (!snapshot) {
      return false;
    }

    setIsSaving(true);
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...snapshot,
          expectedSnapshotVersion: initialSnapshotVersion,
        }),
      });
      if (!response.ok) {
        return false;
      }
      const data = (await response.json()) as {
        saved?: boolean;
        snapshotVersion?: number;
        updatedAt?: string;
      };
      if (
        !data.saved ||
        typeof data.snapshotVersion !== "number" ||
        typeof data.updatedAt !== "string"
      ) {
        return false;
      }

      whiteboardRef.current?.save();
      whiteboardRef.current?.markSynced(snapshot);
      setInitialSnapshotVersion(data.snapshotVersion);
      setInitialSnapshotUpdatedAt(data.updatedAt);
      return true;
    } catch (error) {
      console.error("Unable to save the whiteboard.", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [apiUrl, initialSnapshotVersion]);

  const refreshWorkspace = React.useCallback(() => {
    // The loading transition unmounts the canvas, allowing it to persist any
    // local work before the latest database snapshot is fetched again.
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  const renameWorkspace = React.useCallback(
    async (nextProjectName: string) => {
      try {
        const response = await fetch(`/api/project/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectName: nextProjectName }),
        });
        if (!response.ok) return false;

        const data = (await response.json()) as {
          board?: { projectName?: string };
        };
        const savedName = data.board?.projectName;
        if (!savedName) return false;
        setProjectName(savedName);
        document.title = `${savedName} / Clariose`;
        return true;
      } catch (error) {
        console.error("Unable to rename the workspace.", error);
        return false;
      }
    },
    [projectId],
  );

  const saveActiveTab = React.useCallback(async () => {
    if (activeTab === "docs") {
      return docsRef.current?.save() ?? true;
    }
    return saveWhiteboard();
  }, [activeTab, saveWhiteboard]);

  const requestLeave = React.useCallback(() => {
    if (
      whiteboardRef.current?.hasUnsyncedChanges() ||
      docsRef.current?.hasUnsyncedChanges()
    ) {
      setIsLeaveDialogOpen(true);
      return;
    }
    router.push("/dashboard");
  }, [router]);

  const getDiagramContext = React.useCallback((): DiagramContext | null => {
    return whiteboardRef.current?.getContext() ?? null;
  }, []);

  const applyDiagramProposal = React.useCallback(
    (proposal: DiagramProposal, mode: "add" | "replace-selection"): ApplyProposalResult =>
      whiteboardRef.current?.applyProposal(proposal, mode) ?? { success: false, error: "The whiteboard is not ready yet." },
    [],
  );

  const undoAiInsertion = React.useCallback(() => whiteboardRef.current?.undoLastAiInsertion() ?? false, []);

  const openAiHelper = React.useCallback(() => {
    setActiveTab("whiteboard");
    setIsAiOpen(true);
  }, []);

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (
        whiteboardRef.current?.hasUnsyncedChanges() ||
        docsRef.current?.hasUnsyncedChanges()
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  if (loadState === "loading") {
    return (
      <main className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Loading whiteboard...
      </main>
    );
  }

  if (loadState === "error") {
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-3 bg-background text-center text-foreground">
        <p>Unable to load this whiteboard.</p>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
          onClick={() => setLoadAttempt((attempt) => attempt + 1)}
        >
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <WorkspaceHeader
        projectId={actualProjectId}
        projectName={projectName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSave={saveActiveTab}
        onRefresh={refreshWorkspace}
        onRequestLeave={requestLeave}
        isSaving={isSaving || isDocsSaving}
        canEdit={permission === "editor"}
        isShared={Boolean(shareToken)}
        onRename={shareToken ? undefined : renameWorkspace}
      />
      <div className="min-h-0 flex-1">
        <div className={`min-h-0 ${activeTab === "whiteboard" ? "flex" : "hidden"}`}>
          <div className="min-w-0 flex-1">
              <WhiteboardComponent
                ref={whiteboardRef}
                projectId={projectId}
                projectName={projectName}
                initialSnapshot={initialSnapshot}
                onOpenAi={openAiHelper}
                readOnly={permission !== "editor"}
              />
          </div>
          {isAiOpen ? (
              <AiCanvasPanel
                projectId={projectId}
                getContext={getDiagramContext}
                onApply={applyDiagramProposal}
                onUndo={undoAiInsertion}
                onSave={saveWhiteboard}
                isSaving={isSaving}
                onClose={() => setIsAiOpen(false)}
              />
          ) : null}
        </div>
        <div className={`min-h-0 ${activeTab === "docs" ? "flex" : "hidden"}`}>
          <DocsComponent
            ref={docsRef}
            projectId={projectId}
            onSavingChange={setIsDocsSaving}
          />
        </div>
      </div>
      <AlertDialog
        open={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keep your workspace changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This workspace has local changes that are not synced with the
              database yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving || isDocsSaving}>Stay here</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSaving || isDocsSaving}
              onClick={() => {
                whiteboardRef.current?.discard();
                docsRef.current?.discard();
                setIsLeaveDialogOpen(false);
                router.push("/dashboard");
              }}
            >
              Discard
            </AlertDialogAction>
            <AlertDialogAction
              disabled={isSaving || isDocsSaving}
              onClick={async (event) => {
                event.preventDefault();
                const [whiteboardSaved, docsSaved] = await Promise.all([
                  whiteboardRef.current?.hasUnsyncedChanges()
                    ? saveWhiteboard()
                    : true,
                  docsRef.current?.hasUnsyncedChanges()
                    ? docsRef.current.save()
                    : true,
                ]);
                if (whiteboardSaved && docsSaved) {
                  setIsLeaveDialogOpen(false);
                  router.push("/dashboard");
                }
              }}
            >
              {isSaving || isDocsSaving ? "Saving..." : "Keep changes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
