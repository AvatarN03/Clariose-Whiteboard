import { Suspense } from "react";
import { Message, MessageContent, MessageGroup, MessageHeader } from "@/components/ui/message";
import { CreateBoardDialog } from "@/components/custom/create-board-dialog";
import { BoardEmptyState } from "@/components/custom/board-empty-state";
import { BoardGrid } from "@/components/custom/board-grid";
import { currentUser } from "@clerk/nextjs/server";
import { getBoardsForUser } from "@/lib/boards/queries";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const boards = userEmail ? await getBoardsForUser(userEmail) : [];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 lg:px-10">
      <p className="text-sm font-medium text-[#756f65]">Dashboard</p>
      <h1 className="font-board mt-2 text-4xl font-semibold tracking-tighter">Your boards, in one place.</h1>
      <p className="mt-3 max-w-lg text-muted-foreground">
        Open a board and keep your thinking moving.
      </p>

      {boards.length > 0 ? (
        <>
          <div className="mt-10 flex items-center justify-between gap-4">
            <h2 className="font-board text-2xl font-semibold tracking-[-0.03em]">
              All boards
            </h2>
          <CreateBoardDialog
            trigger={
              <button className="text-sm font-semibold text-[#ec6338] hover:text-[#d9562d]">
                Create board
              </button>
            }
          />
          </div>
          <section className="mt-5">
            <BoardGrid boards={boards} />
          </section>
        </>
      ) : (
        <section className="mt-10">
          <BoardEmptyState />
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b9489]">AI helper</p>
            <h2 className="font-board mt-2 text-2xl font-semibold tracking-[-0.03em]">A quiet place to start.</h2>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Coming next</span>
        </div>
        <MessageGroup className="mt-6 max-w-xl">
          <Message>
            <MessageContent className="rounded-xl bg-muted p-4 text-muted-foreground">
              <MessageHeader className="px-0 text-foreground">Clariose</MessageHeader>
              Tell me what you are trying to make sense of, and we will give the first few thoughts a shape.
            </MessageContent>
          </Message>
        </MessageGroup>
      </section>
    </main>
  );
}
