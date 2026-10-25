import Link from "next/link";
import { Suspense } from "react";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<DashboardShell />}> 
      <ProtectedDashboardLayout>{children}</ProtectedDashboardLayout>
    </Suspense>
  );
}

async function ProtectedDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await auth.protect();

  return <DashboardShell>{children}</DashboardShell>;
}

function DashboardShell({ children }: Readonly<{ children?: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen bg-[#f8f7f4] text-[#1d1d1b]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#ded9cf] bg-[#f3f0e9] px-4 py-5 md:flex">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
          <span className="grid size-8 place-items-center rounded-lg bg-[#1d1d1b] text-xs font-bold text-white">
            A
          </span>
          <span className="font-board text-lg font-semibold tracking-[-0.03em]">Agente</span>
        </Link>

        <button className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-[#ec6338] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d9562d]">
          <span className="text-lg leading-none">+</span>
          Create board
        </button>

        <nav className="mt-8 space-y-1" aria-label="Workspace navigation">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-[#1d1d1b] shadow-sm">
            <span aria-hidden="true">▦</span>
            Overview
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#756f65] transition hover:bg-white/70 hover:text-[#1d1d1b]">
            <span aria-hidden="true">□</span>
            All boards
          </Link>
        </nav>

        <div className="mt-auto border-t border-[#ded9cf] pt-4">
          <div className="flex items-center justify-between gap-3 px-2">
            <span className="text-xs text-[#756f65]">Account</span>
            <UserButton />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[#ded9cf] bg-white px-6 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-[#1d1d1b] text-xs font-bold text-white">A</span>
            <span className="font-board text-lg font-semibold">Agente</span>
          </Link>
          <UserButton />
        </header>
        {children}
      </div>
    </div>
  );
}
