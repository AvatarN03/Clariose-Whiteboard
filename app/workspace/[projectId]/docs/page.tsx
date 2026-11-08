import { Suspense } from "react";
import { AuthGate } from "@/components/custom/auth-gate";
import { WorkspaceView } from "@/components/custom/workspace-view";

type DocsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default function DocsPage(props: DocsPageProps) {
  return (
    <Suspense fallback={null}>
      <DocsContent {...props} />
    </Suspense>
  );
}

async function DocsContent({ params }: DocsPageProps) {
  const { projectId } = await params;

  return (
    <Suspense fallback={null}>
      <AuthGate>
        <WorkspaceView projectId={projectId} initialTab="docs" />
      </AuthGate>
    </Suspense>
  );
}
