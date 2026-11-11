import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { boards, whiteboardData } from "@/db/schema";

type WhiteboardPayload = {
  elements?: unknown;
  appState?: unknown;
  files?: unknown;
  expectedSnapshotVersion?: unknown;
};

async function getOwnedBoard(projectId: string, userEmail: string) {
  const [board] = await db
    .select({
      projectId: boards.projectId,
      projectName: boards.projectName,
      createdAt: boards.createdAt,
      archivedAt: boards.archivedAt,
    })
    .from(boards)
    .where(and(eq(boards.projectId, projectId), eq(boards.userEmail, userEmail)))
    .limit(1);

  return board;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const { projectId } = await params;

  try {
    const project = await getOwnedBoard(projectId, userEmail);
    if (!project) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    const [snapshot] = await db
      .select({
        snapshotVersion: whiteboardData.snapshotVersion,
        updatedAt: whiteboardData.updatedAt,
        elements: whiteboardData.elements,
        appState: whiteboardData.appState,
        files: whiteboardData.files,
      })
      .from(whiteboardData)
      .where(eq(whiteboardData.projectId, projectId))
      .limit(1);

    return Response.json({
      project,
      snapshot:
        snapshot &&
        Array.isArray(snapshot.elements) &&
        isRecord(snapshot.appState) &&
        isRecord(snapshot.files)
          ? snapshot
          : null,
    });
  } catch (error) {
    console.error("Failed to load whiteboard.", error);
    return Response.json(
      { error: "Unable to load the whiteboard right now." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const board = await getOwnedBoard(projectId, userEmail);

    if (!board) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    const [existing] = await db
      .select({
        id: whiteboardData.id,
        snapshotVersion: whiteboardData.snapshotVersion,
      })
      .from(whiteboardData)
      .where(eq(whiteboardData.projectId, projectId))
      .limit(1);

    const updatedAt = new Date().toISOString();
    const snapshotVersion = existing ? existing.snapshotVersion + 1 : 1;

    if (existing) {
      if (
        typeof body.expectedSnapshotVersion === "number" &&
        body.expectedSnapshotVersion !== existing.snapshotVersion
      ) {
        return Response.json(
          { error: "The board changed. Refresh before saving." },
          { status: 409 },
        );
      }
      await db
        .update(whiteboardData)
        .set({
          snapshotVersion,
          updatedAt,
          elements: body.elements,
          appState: body.appState,
          files: body.files,
        })
        .where(eq(whiteboardData.id, existing.id));
    } else {
      await db.insert(whiteboardData).values({
        projectId,
        snapshotVersion,
        updatedAt,
        elements: body.elements,
        appState: body.appState,
        files: body.files,
      });
    }

    // Ensure the next render/navigation of this workspace (and the dashboard
    // preview) reads the snapshot that was just persisted.
    revalidatePath(`/workspace/${projectId}`);
    revalidatePath("/dashboard");

    return Response.json({ saved: true, snapshotVersion, updatedAt });
  } catch (error) {
    console.error("Failed to save whiteboard.", error);
    return Response.json(
      { error: "Unable to save the whiteboard right now." },
      { status: 500 },
    );
  }
}
