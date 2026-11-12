import { currentUser } from "@clerk/nextjs/server";
import { BoardGrid } from "@/components/custom/board-grid";
import { getSharedBoardsForUser } from "@/lib/boards/queries";

export default async function SharedPage() {
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const boards = user?.id && userEmail
    ? await getSharedBoardsForUser(user.id, userEmail)
    : [];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 lg:px-10">
      <p className="text-sm font-medium text-[#756f65] dark:text-muted-foreground">Shared</p>
      <h1 className="font-board mt-2 text-4xl font-semibold tracking-tighter">Boards shared with you.</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Open a board that someone has shared with your account.
      </p>
      {boards.length > 0 ? (
        <section className="mt-10">
          <BoardGrid boards={boards} />
        </section>
      ) : (
        <section className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12">
          <h2 className="font-board text-xl font-semibold tracking-[-0.03em]">
            Nothing shared yet
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Boards shared with your account will appear here.
          </p>
        </section>
      )}
    </main>
  );
}
