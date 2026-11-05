import { BoardCard, type DashboardBoard } from "@/components/custom/board-card";

export function BoardGrid({ boards, archived = false }: { boards: DashboardBoard[]; archived?: boolean }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => (
        <BoardCard key={board.projectId} board={board} archived={archived} />
      ))}
    </div>
  );
}
