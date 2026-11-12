import { and, desc, eq, isNotNull, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { boardShares, boards, whiteboardData } from "@/db/schema";

const boardSelection = {
  id: boards.id,
  projectId: boards.projectId,
  projectName: boards.projectName,
  createdAt: boards.createdAt,
  archivedAt: boards.archivedAt,
  snapshotVersion: whiteboardData.snapshotVersion,
  updatedAt: whiteboardData.updatedAt,
  elements: whiteboardData.elements,
  appState: whiteboardData.appState,
  files: whiteboardData.files,
};

async function getBoards(userEmail: string, archived: boolean) {
  return db
    .select(boardSelection)
    .from(boards)
    .leftJoin(whiteboardData, eq(whiteboardData.projectId, boards.projectId))
    .where(
      archived
        ? and(eq(boards.userEmail, userEmail), isNotNull(boards.archivedAt))
        : and(eq(boards.userEmail, userEmail), isNull(boards.archivedAt)),
    )
    .orderBy(desc(archived ? boards.archivedAt : boards.createdAt));
}

export function getBoardsForUser(userEmail: string) {
  return getBoards(userEmail, false);
}

export function getArchivedBoardsForUser(userEmail: string) {
  return getBoards(userEmail, true);
}

export function getSharedBoardsForUser(userId: string, userEmail: string) {
  return db
    .select({
      ...boardSelection,
      shareToken: boardShares.token,
      sharePermission: boardShares.permission,
    })
    .from(boardShares)
    .innerJoin(boards, eq(boards.projectId, boardShares.projectId))
    .leftJoin(whiteboardData, eq(whiteboardData.projectId, boards.projectId))
    .where(
      and(
        or(
          eq(boardShares.recipientUserId, userId),
          eq(boardShares.email, userEmail.toLowerCase()),
        ),
        isNull(boards.archivedAt),
      ),
    )
    .orderBy(desc(boardShares.createdAt));
}