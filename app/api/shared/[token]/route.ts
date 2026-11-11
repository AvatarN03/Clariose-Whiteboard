import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { whiteboardData } from "@/db/schema";
import { getShareByToken } from "@/lib/boards/sharing";

type SnapshotPayload = {
  elements?: unknown;
  appState?: unknown;
  files?: unknown;
  expectedSnapshotVersion?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  try {
    const share = await getShareByToken(token);
    if (!share) return Response.json({ error: "Share link not found." }, { status: 404 });
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!email || email !== share.email.toLowerCase()) {
      return Response.json({ error: "This invitation is for another account." }, { status: 403 });
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
      .where(eq(whiteboardData.projectId, share.projectId))
      .limit(1);

    return Response.json({
      project: { projectId: share.projectId, projectName: share.projectName },
      permission: share.permission,
      snapshot: snapshot ?? null,
    });
  } catch (error) {
    console.error("Failed to load shared whiteboard.", error);
    return Response.json({ error: "Unable to load the shared whiteboard." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let body: SnapshotPayload;
  try {
    body = (await request.json()) as SnapshotPayload;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    !Array.isArray(body.elements) ||
    !isRecord(body.appState) ||
    !isRecord(body.files)
  ) {
    return Response.json({ error: "A complete whiteboard snapshot is required." }, { status: 400 });
  }

  try {
    const share = await getShareByToken(token);
    if (!share) return Response.json({ error: "Share link not found." }, { status: 404 });
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!email || email !== share.email.toLowerCase()) {
      return Response.json({ error: "This invitation is for another account." }, { status: 403 });
    }
    if (share.permission !== "editor") {
      return Response.json({ error: "This share link is view-only." }, { status: 403 });
    }

    const [existing] = await db
      .select({ id: whiteboardData.id, snapshotVersion: whiteboardData.snapshotVersion })
      .from(whiteboardData)
      .where(eq(whiteboardData.projectId, share.projectId))
      .limit(1);
    const expected = typeof body.expectedSnapshotVersion === "number"
      ? body.expectedSnapshotVersion
      : existing?.snapshotVersion ?? 0;
    if (existing && expected !== existing.snapshotVersion) {
      return Response.json({ error: "The board changed. Refresh before saving." }, { status: 409 });
    }

    const nextVersion = (existing?.snapshotVersion ?? 0) + 1;
    const updatedAt = new Date().toISOString();
    if (existing) {
      await db.update(whiteboardData).set({
        snapshotVersion: nextVersion,
        updatedAt,
        elements: body.elements,
        appState: body.appState,
        files: body.files,
      }).where(eq(whiteboardData.id, existing.id));
    } else {
      await db.insert(whiteboardData).values({
        projectId: share.projectId,
        snapshotVersion: nextVersion,
        updatedAt,
        elements: body.elements,
        appState: body.appState,
        files: body.files,
      });
    }

    return Response.json({ saved: true, snapshotVersion: nextVersion, updatedAt });
  } catch (error) {
    console.error("Failed to save shared whiteboard.", error);
    return Response.json({ error: "Unable to save the shared whiteboard." }, { status: 500 });
  }
}
