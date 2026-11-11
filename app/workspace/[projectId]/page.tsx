import { Suspense } from "react";
import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { WorkspaceView } from "@/components/custom/workspace-view";
import { AuthGate } from "@/components/custom/auth-gate";
import { db } from "@/db";
import { boards } from "@/db/schema";

type WorkspacePageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function generateMetadata({ params }: WorkspacePageProps): Promise<Metadata> {
  const { projectId } = await params;

  try {
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    if (!userEmail) return { title: "Workspace / Clariose" };

    const [board] = await db
      .select({ projectName: boards.projectName })
      .from(boards)
      .where(and(eq(boards.projectId, projectId), eq(boards.userEmail, userEmail)))
      .limit(1);

    return {
      title: board ? `${board.projectName} / Clariose` : "Workspace / Clariose",
    };
  } catch (error) {
    console.error("Unable to generate workspace metadata.", error);
    return { title: "Workspace / Clariose" };
  }
}

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
