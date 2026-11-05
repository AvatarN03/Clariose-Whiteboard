import { Button } from "@/components/ui/button";
import { CreateBoardDialog } from "@/components/custom/create-board-dialog";

export function BoardEmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12">
      <div className="max-w-md">
        <span className="grid size-10 place-items-center rounded-xl bg-[#f3f0ea] text-xl text-[#ec6338]">
          +
        </span>
        <h2 className="font-board mt-5 text-xl font-semibold tracking-[-0.03em]">
          Start with a blank board
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#756f65]">
          Create a space for your ideas, planning, and collaboration.
        </p>
        <CreateBoardDialog
          trigger={
            <Button className="mt-6 bg-[#1d1d1b] text-sm text-white hover:bg-[#3b3a36]">
              Create board
            </Button>
          }
        />
      </div>
    </section>
  );
}
