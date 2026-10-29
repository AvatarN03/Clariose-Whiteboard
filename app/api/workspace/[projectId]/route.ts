import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { boards, whiteboardData } from "@/db/schema";

type WhiteboardPayload = {
  elements?: unknown;
  appState?: unknown;
  files?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const userEmail = user.primaryEmailAddress?.emailAddress;
  if (!userEmail) {
    return Response.json(
      { error: "Your account does not have a primary email address." },
      { status: 400 },
    );
  }

  let body: WhiteboardPayload;
  try {
    body = (await request.json()) as WhiteboardPayload;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    !Array.isArray(body.elements) ||
    !isRecord(body.appState) ||
    !isRecord(body.files)
  ) {
    return Response.json(
      { error: "A complete whiteboard snapshot is required." },
      { status: 400 },
    );
  }

  try {
    const [board] = await db
      .select({ projectId: boards.projectId })
      .from(boards)
      .where(and(eq(boards.projectId, projectId), eq(boards.userEmail, userEmail)))
      .limit(1);

    if (!board) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    const [existing] = await db
      .select({ id: whiteboardData.id })
      .from(whiteboardData)
      .where(eq(whiteboardData.projectId, projectId))
      .limit(1);

    if (existing) {
      await db
        .update(whiteboardData)
        .set({
          elements: body.elements,
          appState: body.appState,
          files: body.files,
        })
        .where(eq(whiteboardData.id, existing.id));
    } else {
      await db.insert(whiteboardData).values({
        projectId,
        elements: body.elements,
        appState: body.appState,
        files: body.files,
      });
    }

    return Response.json({ saved: true });
  } catch (error) {
    console.error("Failed to save whiteboard.", error);
    return Response.json(
      { error: "Unable to save the whiteboard right now." },
      { status: 500 },
    );
  }
}
