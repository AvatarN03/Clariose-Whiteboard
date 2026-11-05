import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { boards, whiteboardData } from "@/db/schema";

const boardSelection = {
  id: boards.id,
  projectId: boards.projectId,
  projectName: boards.projectName,
  createdAt: boards.createdAt,
  archivedAt: boards.archivedAt,
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