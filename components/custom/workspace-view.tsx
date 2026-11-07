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
import { DocsComponent } from "@/components/custom/docs-component";
import type {
  WhiteboardComponentHandle,
  SceneSnapshot,
} from "@/components/custom/whiteboard-component";
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
};

export function WorkspaceView({ projectId }: WorkspaceViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] =
    React.useState<WorkspaceTab>("whiteboard");
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [loadState, setLoadState] = React.useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [initialSnapshot, setInitialSnapshot] =
    React.useState<SceneSnapshot | null>(null);
  const [initialSnapshotUpdatedAt, setInitialSnapshotUpdatedAt] =
    React.useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = React.useState(0);
  const whiteboardRef = React.useRef<WhiteboardComponentHandle>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setLoadState("loading");
      try {
        const response = await fetch(`/api/workspace/${projectId}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Workspace request failed with ${response.status}`);
        }

        const data = (await response.json()) as {
          snapshot: (SceneSnapshot & {
            updatedAt: string;
          }) | null;
        };

        if (cancelled) {
          return;
        }

        setInitialSnapshot(data.snapshot);
        setInitialSnapshotUpdatedAt(data.snapshot?.updatedAt ?? null);
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
  }, [loadAttempt, projectId]);

  const saveWhiteboard = React.useCallback(async () => {
    const snapshot = whiteboardRef.current?.getSnapshot();
    if (!snapshot) {
      return false;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/workspace/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      if (!response.ok) {
        return false;
      }
      whiteboardRef.current?.save();
      whiteboardRef.current?.markSynced();
      return true;
    } catch (error) {
      console.error("Unable to save the whiteboard.", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [projectId]);

  const refreshWorkspace = React.useCallback(() => {
    // The loading transition unmounts the canvas, allowing it to persist any
    // local work before the latest database snapshot is fetched again.
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  const requestLeave = React.useCallback(() => {
    if (whiteboardRef.current?.hasUnsyncedChanges()) {
      setIsLeaveDialogOpen(true);
      return;
    }
    router.push("/dashboard");
  }, [router]);

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (whiteboardRef.current?.hasUnsyncedChanges()) {
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
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSave={saveWhiteboard}
        onRefresh={refreshWorkspace}
        onRequestLeave={requestLeave}
        isSaving={isSaving}
      />
      <div className="flex min-h-0 flex-1">
        {activeTab === "whiteboard" ? (
          <WhiteboardComponent
            ref={whiteboardRef}
            projectId={projectId}
            initialSnapshot={initialSnapshot}
            initialSnapshotUpdatedAt={initialSnapshotUpdatedAt}
          />
        ) : (
          <DocsComponent projectId={projectId} />
        )}
      </div>
      <AlertDialog
        open={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keep your whiteboard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This whiteboard has local changes that are not synced with the
              database yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Stay here</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSaving}
              onClick={() => {
                whiteboardRef.current?.discard();
                setIsLeaveDialogOpen(false);
                router.push("/dashboard");
              }}
            >
              Discard
            </AlertDialogAction>
            <AlertDialogAction
              disabled={isSaving}
              onClick={async (event) => {
                event.preventDefault();
                const saved = await saveWhiteboard();
                if (saved) {
                  setIsLeaveDialogOpen(false);
                  router.push("/dashboard");
                }
              }}
            >
              {isSaving ? "Saving..." : "Keep changes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
