import { randomUUID } from "node:crypto";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { boardShares, boards } from "@/db/schema";
import {
  getOwnedShare,
  isSharePermission,
  type SharePermission,
} from "@/lib/boards/sharing";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  if (!userEmail) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  let body: { permission?: unknown; email?: unknown };
  try {
    body = (await request.json()) as { permission?: unknown };
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const permission = body.permission;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isSharePermission(permission) || !email || !email.includes("@")) {
    return Response.json({ error: "A valid permission is required." }, { status: 400 });
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

    const existing = await getOwnedShare(projectId, userEmail, email);
    let share = existing;
    if (share) {
      if (share.permission !== permission) {
        await db
          .update(boardShares)
          .set({ permission })
          .where(eq(boardShares.token, share.token));
        share = { ...share, permission };
      }
    } else {
      const inserted = await db
        .insert(boardShares)
        .values({
          projectId,
          email,
          token: randomUUID(),
          permission: permission as SharePermission,
        })
        .returning({
          token: boardShares.token,
          email: boardShares.email,
          recipientUserId: boardShares.recipientUserId,
          permission: boardShares.permission,
        });
      share = inserted[0];
    }

    return Response.json({
      token: share?.token,
      email: share?.email ?? email,
      permission: share?.permission,
      url: `${new URL(request.url).origin}/shared/${share?.token}`,
    });
  } catch (error) {
    console.error("Failed to create board share.", error);
    return Response.json({ error: "Unable to create a share link right now." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  if (!userEmail) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  try {
    const [board] = await db
      .select({ projectId: boards.projectId })
      .from(boards)
      .where(and(eq(boards.projectId, projectId), eq(boards.userEmail, userEmail)))
      .limit(1);
    if (!board) return Response.json({ error: "Project not found." }, { status: 404 });

    await db.delete(boardShares).where(eq(boardShares.projectId, projectId));
    return Response.json({ revoked: true });
  } catch (error) {
    console.error("Failed to revoke board shares.", error);
    return Response.json({ error: "Unable to revoke share links right now." }, { status: 500 });
  }
}
