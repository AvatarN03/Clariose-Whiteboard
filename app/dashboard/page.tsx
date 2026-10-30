import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Message, MessageContent, MessageGroup, MessageHeader } from "@/components/ui/message";
import { CreateBoardDialog } from "@/components/custom/create-board-dialog";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 lg:px-10">
      <p className="text-sm font-medium text-[#756f65]">Dashboard</p>
      <h1 className="font-board mt-2 text-4xl font-semibold tracking-[-0.05em]">Your boards, in one place.</h1>
      <p className="mt-3 max-w-lg text-muted-foreground">
        Your whiteboard workspace is ready for the first board.
      </p>

      <section className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12">
        <div className="max-w-md">
          <span className="grid size-10 place-items-center rounded-xl bg-[#f3f0ea] text-xl text-[#ec6338]">+</span>
          <h2 className="font-board mt-5 text-xl font-semibold tracking-[-0.03em]">Start with a blank board</h2>
          <p className="mt-2 text-sm leading-6 text-[#756f65]">
            This is the dashboard boilerplate. Board creation and collaboration can be added here next.
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
