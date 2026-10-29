"use client";

import * as React from "react";
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
import {
  WhiteboardComponent,
  type WhiteboardComponentHandle,
} from "@/components/custom/whiteboard-component";
import {
  WorkspaceHeader,
  type WorkspaceTab,
} from "@/components/custom/workspace-header";

type WorkspaceViewProps = {
  projectId: string;
};

export function WorkspaceView({ projectId }: WorkspaceViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] =
    React.useState<WorkspaceTab>("whiteboard");
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const whiteboardRef = React.useRef<WhiteboardComponentHandle>(null);

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

  return (
    <main className="flex min-h-screen flex-col bg-[#f8f7f4] text-[#1d1d1b]">
      <WorkspaceHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSave={saveWhiteboard}
        onRequestLeave={requestLeave}
        isSaving={isSaving}
      />
      <div className="flex min-h-0 flex-1">
        {activeTab === "whiteboard" ? (
          <WhiteboardComponent ref={whiteboardRef} projectId={projectId} />
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
