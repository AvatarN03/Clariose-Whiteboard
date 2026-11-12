import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { boardShares, boards, whiteboardData } from "@/db/schema";

export type SharePermission = "viewer" | "editor";

export function isSharePermission(value: unknown): value is SharePermission {
  return value === "viewer" || value === "editor";
}

export async function getShareByToken(token: string) {
  const [share] = await db
    .select({
      projectId: boards.projectId,
      projectName: boards.projectName,
      email: boardShares.email,
      recipientUserId: boardShares.recipientUserId,
      permission: boardShares.permission,
      archivedAt: boards.archivedAt,
    })
    .from(boardShares)
    .innerJoin(boards, eq(boards.projectId, boardShares.projectId))
    .where(eq(boardShares.token, token))
    .limit(1);

  if (!share || share.archivedAt) {
    return null;
  }

  return {
    ...share,
    permission: isSharePermission(share.permission)
      ? share.permission
      : ("viewer" as const),
  };
}

export async function getSharedWorkspace(token: string) {
  const share = await getShareByToken(token);
  if (!share) {
    return null;
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

  return {
    project: {
      projectId: share.projectId,
      projectName: share.projectName,
    },
    permission: share.permission,
    snapshot:
      snapshot &&
      Array.isArray(snapshot.elements) &&
      typeof snapshot.appState === "object" &&
      snapshot.appState !== null &&
      typeof snapshot.files === "object" &&
      snapshot.files !== null
        ? snapshot
        : null,
  };
}

export async function getOwnedShare(
  projectId: string,
  userEmail: string,
  email: string,
) {
  const [share] = await db
    .select({
      token: boardShares.token,
      permission: boardShares.permission,
      email: boardShares.email,
      recipientUserId: boardShares.recipientUserId,
    })
    .from(boardShares)
    .innerJoin(boards, eq(boards.projectId, boardShares.projectId))
    .where(
      and(
        eq(boardShares.projectId, projectId),
        eq(boardShares.email, email),
        eq(boards.userEmail, userEmail),
      ),
    )
    .limit(1);

  return share ?? null;
}
