import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { boards } from "@/db/schema";

export async function getOwnedBoard(projectId: string, userEmail: string) {
  const [board] = await db
    .select({ projectId: boards.projectId })
    .from(boards)
    .where(and(eq(boards.projectId, projectId), eq(boards.userEmail, userEmail)))
    .limit(1);

  return board ?? null;
}
