import { Button } from "@/components/ui/button";

type DashboardPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
};

export function DashboardPlaceholder({
  eyebrow,
  title,
  description,
  actionLabel,
}: DashboardPlaceholderProps) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 lg:px-10">
      <p className="text-sm font-medium text-[#756f65]">{eyebrow}</p>
      <h1 className="font-board mt-2 text-4xl font-semibold tracking-[-0.05em]">{title}</h1>
      <p className="mt-3 max-w-lg text-[#615f59]">{description}</p>

      <section className="mt-10 rounded-2xl border border-dashed border-[#ccc5ba] bg-white p-8 sm:p-12">
        <div className="max-w-md">
          <span className="grid size-10 place-items-center rounded-xl bg-[#f3f0ea] text-xl text-[#ec6338]">+</span>
          <h2 className="font-board mt-5 text-xl font-semibold tracking-[-0.03em]">{actionLabel}</h2>
          <p className="mt-2 text-sm leading-6 text-[#756f65]">
            This area is ready for the next part of your workspace.
          </p>
          <Button className="mt-6 bg-[#1d1d1b] text-sm text-white hover:bg-[#3b3a36]">
            Get started
          </Button>
        </div>
      </section>
    </main>
  );
}
