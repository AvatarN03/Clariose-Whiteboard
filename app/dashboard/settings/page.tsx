import { currentUser } from "@clerk/nextjs/server";
import { Check, LockKeyhole, Sparkles, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/custom/theme-toggle";
import { UserButton } from "@clerk/nextjs";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function SettingsPage() {
  const user = await currentUser();
  const name = user?.fullName || user?.username || "Clariose member";
  const email = user?.primaryEmailAddress?.emailAddress || "No primary email";
  const initials = getInitials(name);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 lg:px-10">
      <p className="text-sm font-medium text-[#756f65] dark:text-muted-foreground">Settings</p>
      <h1 className="font-board mt-2 text-4xl font-semibold tracking-tighter">Make Clariose yours.</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Manage your account, appearance, and the way Clariose will work with you.
      </p>

      <div className="mt-10 space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b9489]">Account</p>
              <h2 className="font-board mt-2 text-2xl font-semibold tracking-[-0.03em]">Your Clerk profile</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your identity and sign-in details are securely managed by Clerk.
              </p>
            </div>
            <Badge variant="secondary" className="gap-1.5">
              <Check className="size-3.5" aria-hidden="true" /> Connected
            </Badge>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-muted/60 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar size="lg">
                <AvatarImage src={user?.imageUrl} alt="" />
                <AvatarFallback>{initials || <UserRound className="size-5" aria-hidden="true" />}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{name}</p>
                <p className="truncate text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-muted-foreground sm:inline">Edit profile and security</span>
              <UserButton userProfileMode="modal" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b9489]">Appearance</p>
              <h2 className="font-board mt-2 text-2xl font-semibold tracking-[-0.03em]">Choose your atmosphere.</h2>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Switch between the light and dark canvas whenever you need a different working mood.
              </p>
            </div>
            <ThemeToggle className="mt-1 shrink-0" />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff0e9] text-[#ec6338] dark:bg-[#ec6338]/15">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-board text-2xl font-semibold tracking-[-0.03em]">AI assistant preferences</h2>
                <Badge variant="outline">Coming next</Badge>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Gemini will help you turn rough thoughts into useful board content. These controls will let you decide when the assistant can read a board, whether it needs your approval before making changes, and how generated content is handled.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <LockKeyhole className="size-4" aria-hidden="true" /> Board access will be explicit
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <Check className="size-4" aria-hidden="true" /> Changes will require approval
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
