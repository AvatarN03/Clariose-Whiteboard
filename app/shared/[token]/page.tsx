import { Suspense } from "react";
import { AuthGate } from "@/components/custom/auth-gate";
import { WorkspaceView } from "@/components/custom/workspace-view";

export default function SharedWorkspacePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <SharedWorkspaceContent params={params} />
    </Suspense>
  );
}

async function SharedWorkspaceContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <Suspense fallback={null}>
      <AuthGate>
        <WorkspaceView projectId={`shared:${token}`} shareToken={token} />
      </AuthGate>
    </Suspense>
  );
}
