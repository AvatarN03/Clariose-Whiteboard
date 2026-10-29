import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { WorkspaceView } from "@/components/custom/workspace-view";

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
  await auth.protect();
  const { projectId } = await params;

  return <WorkspaceView projectId={projectId} />;
}
