import { Suspense } from "react";
import { WorkspaceView } from "@/components/custom/workspace-view";
import { AuthGate } from "@/components/custom/auth-gate";

type WorkspacePageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default function WorkspacePage(props: WorkspacePageProps) {
  return (
    <Suspense fallback={null}>
      <WorkspaceContent {...props} />
    </Suspense>
  );
}

async function WorkspaceContent({
  params,
}: WorkspacePageProps) {
  const { projectId } = await params;

  return (
    <Suspense fallback={null}>
      <AuthGate>
        <WorkspaceView projectId={projectId} />
      </AuthGate>
    </Suspense>
  );
}
