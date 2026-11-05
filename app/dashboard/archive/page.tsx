import { currentUser } from "@clerk/nextjs/server";
import { Archive } from "lucide-react";
import { BoardGrid } from "@/components/custom/board-grid";
import { getArchivedBoardsForUser } from "@/lib/boards/queries";

export default async function ArchivePage() {
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const boards = userEmail ? await getArchivedBoardsForUser(userEmail) : [];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 lg:px-10">
      <p className="text-sm font-medium text-[#756f65] dark:text-muted-foreground">Archive</p>
      <h1 className="font-board mt-2 text-4xl font-semibold tracking-tighter">A quiet place for old boards.</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Archived boards stay here until you are ready to bring them back.
      </p>

      {boards.length > 0 ? (
        <section className="mt-10">
          <div className="mb-5 flex items-center gap-2">
            <Archive className="size-5 text-[#ec6338]" aria-hidden="true" />
            <h2 className="font-board text-2xl font-semibold tracking-[-0.03em]">
              Archived boards
            </h2>
          </div>
          <BoardGrid boards={boards} archived />
        </section>
      ) : (
        <section className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12">
          <Archive className="size-7 text-[#ec6338]" aria-hidden="true" />
          <h2 className="font-board mt-5 text-xl font-semibold tracking-[-0.03em]">
            Nothing archived yet
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            When you archive a board from the overview, it will appear here and can be restored at any time.
          </p>
        </section>
      )}
    </main>
  );
}
