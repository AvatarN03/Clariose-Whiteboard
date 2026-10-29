import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { WorkspaceHeader } from "@/components/custom/workspace-header";

type WorkspacePageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default function WorkspacePage(props: WorkspacePageProps) {
  return (
    <Suspense fallback={null}>
      <WorkspaceContent {...props} />
    </Suspense>
  );
}

async function WorkspaceContent({
  params,
}: WorkspacePageProps) {
  await auth.protect();
  const { projectId } = await params;

  return (
    <main className="flex min-h-screen flex-col bg-[#f8f7f4] text-[#1d1d1b]">
      <WorkspaceHeader />

      <div className="flex min-h-0 flex-1">
        <section className="relative min-h-[calc(100vh-3.5rem)] flex-1 overflow-hidden bg-[#f8f7f4]">
          <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(#ded9cf_1px,transparent_1px),linear-gradient(90deg,#ded9cf_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="relative flex h-full min-h-[calc(100vh-3.5rem)] items-center justify-center p-8">
            <div className="absolute left-4 top-4 flex gap-2 rounded-xl border border-[#ded9cf] bg-white p-2 shadow-sm">
              <button
                type="button"
                className="h-9 rounded-lg bg-[#1d1d1b] px-3 text-sm text-white"
                aria-label="Select tool"
              >
                Select
              </button>
              <button
                type="button"
                className="h-9 rounded-lg border border-[#ded9cf] px-3 text-sm text-[#756f65]"
                aria-label="Add shape"
              >
                Shape
              </button>
              <button
                type="button"
                className="h-9 rounded-lg border border-[#ded9cf] px-3 text-sm text-[#756f65]"
                aria-label="Add text"
              >
                Text
              </button>
            </div>
            <div className="max-w-sm rounded-2xl border border-dashed border-[#ccc5ba] bg-white/90 p-8 text-center shadow-sm">
              <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#f3f0ea] text-2xl text-[#ec6338]">
                +
              </span>
              <h1 className="font-board mt-5 text-2xl font-semibold tracking-[-0.03em]">
                Start shaping your ideas
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#756f65]">
                This is the starting canvas template. Add drawing, text, and
                collaboration tools here next.
              </p>
              <p className="mt-5 break-all font-mono text-xs text-[#9b9489]">
                {projectId}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
