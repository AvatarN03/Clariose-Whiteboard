import { and, eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { boards } from "@/db/schema";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

type UpdateBoardBody = {
  archived?: unknown;
  projectName?: unknown;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await currentUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail = user.primaryEmailAddress?.emailAddress;
  if (!userEmail) {
    return Response.json(
      { error: "Your account does not have a primary email address." },
      { status: 400 },
    );
  }

  let body: UpdateBoardBody;
  try {
    body = (await request.json()) as UpdateBoardBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const hasArchiveUpdate = typeof body.archived === "boolean";
  const projectName =
    typeof body.projectName === "string" ? body.projectName.trim() : null;

  if (hasArchiveUpdate === (projectName !== null)) {
    return Response.json(
      { error: "Provide either a board name or an archived value." },
      { status: 400 },
    );
  }

  if (projectName !== null && (!projectName || projectName.length > 120)) {
    return Response.json(
      { error: "Board names must be between 1 and 120 characters." },
      { status: 400 },
    );
  }

  const { projectId } = await context.params;

  try {
    const [board] = await db
      .update(boards)
      .set(
        projectName !== null
          ? { projectName }
          : { archivedAt: body.archived ? new Date().toISOString() : null },
      )
      .where(and(eq(boards.projectId, projectId), eq(boards.userEmail, userEmail)))
      .returning({
        projectId: boards.projectId,
        projectName: boards.projectName,
        archivedAt: boards.archivedAt,
      });

    if (!board) {
      return Response.json({ error: "Board not found." }, { status: 404 });
    }

    revalidatePath(`/workspace/${projectId}`);
    revalidatePath("/dashboard");

    return Response.json({ board });
  } catch (error) {
    console.error("Failed to update board archive state.", error);
    return Response.json(
      { error: "Unable to update the board right now." },
      { status: 500 },
    );
  }
}
