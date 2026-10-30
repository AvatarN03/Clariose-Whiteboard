"use client";

type DocsComponentProps = {
  projectId: string;
};

export function DocsComponent({ projectId }: DocsComponentProps) {
  return (
    <section className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-1 items-center justify-center bg-[#fff8f1] p-8">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-[#fff0df] text-2xl">
          Aa
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ec6338]">
          Docs component
        </p>
        <h1 className="font-board mt-2 text-3xl font-semibold tracking-[-0.03em]">
          A clear space for your notes
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#756f65]">
          This is the starter view for the Docs component. Replace this
          boilerplate with your editor, project notes, or documentation.
        </p>
        <div className="mt-6 rounded-2xl bg-[#fff8f1] p-4 text-xs text-[#9b9489]">
          Project: <span className="font-mono">{projectId}</span>
        </div>
      </div>
    </section>
  );
}
