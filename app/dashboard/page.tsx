import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await auth.protect();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 lg:px-10">
      <p className="text-sm font-medium text-[#756f65]">Dashboard</p>
      <h1 className="font-board mt-2 text-4xl font-semibold tracking-[-0.05em]">Your boards, in one place.</h1>
      <p className="mt-3 max-w-lg text-[#615f59]">
        Your whiteboard workspace is ready for the first board.
      </p>

      <section className="mt-10 rounded-2xl border border-dashed border-[#ccc5ba] bg-white p-8 sm:p-12">
        <div className="max-w-md">
          <span className="grid size-10 place-items-center rounded-xl bg-[#f3f0ea] text-xl text-[#ec6338]">+</span>
          <h2 className="font-board mt-5 text-xl font-semibold tracking-[-0.03em]">Start with a blank board</h2>
          <p className="mt-2 text-sm leading-6 text-[#756f65]">
            This is the dashboard boilerplate. Board creation and collaboration can be added here next.
          </p>
          <button className="mt-6 rounded-lg bg-[#1d1d1b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#3b3a36]">
            Create board
          </button>
        </div>
      </section>
    </main>
  );
}
