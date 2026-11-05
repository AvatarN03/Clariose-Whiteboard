import { and, eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { boards } from "@/db/schema";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

type UpdateBoardBody = {
  archived?: unknown;
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

  if (typeof body.archived !== "boolean") {
    return Response.json(
      { error: "The archived value must be a boolean." },
      { status: 400 },
    );
  }

  const { projectId } = await context.params;

  try {
    const [board] = await db
      .update(boards)
      .set({ archivedAt: body.archived ? new Date().toISOString() : null })
      .where(and(eq(boards.projectId, projectId), eq(boards.userEmail, userEmail)))
      .returning({
        projectId: boards.projectId,
        projectName: boards.projectName,
        archivedAt: boards.archivedAt,
      });

    if (!board) {
      return Response.json({ error: "Board not found." }, { status: 404 });
    }

    return Response.json({ board });
  } catch (error) {
    console.error("Failed to update board archive state.", error);
    return Response.json(
      { error: "Unable to update the board right now." },
      { status: 500 },
    );
  }
}