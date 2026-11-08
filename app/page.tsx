import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Show,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/custom/brand-logo";
import { ThemeToggle } from "@/components/custom/theme-toggle";

const boardItems = [
  { label: "Research", x: "left-8 top-12", tone: "bg-[#dbeafe]" },
  { label: "Clarify scope", x: "left-[38%] top-20", tone: "bg-[#fef3c7]" },
  { label: "Decide", x: "right-10 top-10", tone: "bg-[#dcfce7]" },
  { label: "Ship a first pass", x: "bottom-10 left-[44%]", tone: "bg-[#fae8ff]" },
];

export default async function Home() {
  const { isAuthenticated } = await auth();

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f7f4] text-[#1d1d1b] transition-colors dark:bg-background dark:text-foreground">
      {/* Subtle canvas dot pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(#b8b0a2_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-25 dark:[background-image:radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Clariose home">
          <BrandLogo nameClassName="text-base" />
        </Link>

        <nav className="flex items-center gap-3">
          <ThemeToggle />
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <Button variant="ghost" className="text-[#55534e] hover:bg-black/5 hover:text-[#1d1d1b] dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-foreground">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
              <Button className="bg-[#1d1d1b] px-4 text-sm text-white hover:bg-[#3b3a36] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90">
                Start a board
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="rounded-lg bg-[#1d1d1b] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3b3a36] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
            >
              Open dashboard
            </Link>
          </Show>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-14 px-6 pb-16 pt-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10 lg:pb-24 lg:pt-20">
        <div className="max-w-xl">
          <p className="mb-6 text-sm font-medium text-[#756f65] dark:text-muted-foreground">A clear place to think together</p>
          <h1 className="font-board text-5xl font-semibold leading-[0.98] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
            Ideas need room
            <br />
            to become useful.
          </h1>
          <p className="mt-7 max-w-md text-lg leading-8 text-[#615f59] dark:text-muted-foreground">
            Clariose is a wide, shared board for untangling the work in front of you.
            Start messy. Keep what matters. Make the next decision obvious.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Show when="signed-out">
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <Button size="lg" className="h-11 bg-[#ec6338] px-5 text-sm font-semibold text-white hover:bg-[#d9562d]">
                  Make your first board
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="rounded-lg bg-[#ec6338] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d9562d]"
              >
                Go to your dashboard
              </Link>
            </Show>
            <span className="text-sm text-[#756f65] dark:text-muted-foreground">Free to start. No card needed.</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <div className="rounded-2xl border border-[#d9d4ca] bg-white p-3 shadow-[0_24px_60px_-34px_rgba(57,50,38,0.38)] sm:p-4 dark:border-border dark:bg-card dark:shadow-[0_24px_60px_-34px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between border-b border-[#ebe7df] px-2 pb-3 dark:border-border">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#e9a99a]" />
                <span className="size-2 rounded-full bg-[#ebcb7e]" />
                <span className="size-2 rounded-full bg-[#91c9a6]" />
              </div>
              <span className="text-xs font-medium text-[#756f65] dark:text-muted-foreground">Q3 planning board</span>
              <span className="rounded-md bg-[#f2f0eb] px-2 py-1 text-[10px] font-semibold text-[#615f59] dark:bg-muted dark:text-muted-foreground">
                4 people
              </span>
            </div>

            <div className="relative mt-3 h-[340px] overflow-hidden rounded-xl border border-[#eeeae2] bg-[#fcfbf8] sm:h-[390px] dark:border-border dark:bg-background">
              <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(#d8d3ca_1px,transparent_1px)] [background-size:18px_18px] dark:opacity-30 dark:[background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)]" />
              <svg
                aria-hidden="true"
                className="absolute inset-0 size-full"
                viewBox="0 0 700 390"
                preserveAspectRatio="none"
              >
                <path d="M138 102 C215 100, 232 130, 300 147" fill="none" className="stroke-[#aaa398] dark:stroke-muted-foreground/60" strokeWidth="1.5" />
                <path d="M390 154 C472 145, 488 110, 554 103" fill="none" className="stroke-[#aaa398] dark:stroke-muted-foreground/60" strokeWidth="1.5" />
                <path d="M355 195 C364 245, 374 260, 390 295" fill="none" className="stroke-[#aaa398] dark:stroke-muted-foreground/60" strokeWidth="1.5" />
              </svg>
              {boardItems.map((item) => (
                <div
                  key={item.label}
                  className={`absolute ${item.x} ${item.tone} text-[#1d1d1b] rounded-lg border border-black/5 dark:border-white/10 px-3 py-2.5 text-xs font-semibold shadow-sm sm:px-4 sm:py-3 sm:text-sm`}
                >
                  {item.label}
                </div>
              ))}
              <div className="absolute bottom-5 left-6 rounded-lg border border-[#d9d4ca] bg-white px-3 py-2 text-xs text-[#615f59] shadow-sm dark:border-border dark:bg-card dark:text-muted-foreground">
                <span className="mr-2 inline-block size-2 rounded-full bg-[#ec6338]" />
                Notes are getting organized
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-[#8a847a] dark:text-muted-foreground">One board, one shared picture of the work.</p>
        </div>
      </section>
    </main>
  );
}
