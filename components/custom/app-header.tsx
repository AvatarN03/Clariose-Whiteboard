import { UserButton } from "@clerk/nextjs";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/custom/theme-toggle";

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 text-foreground sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
          className="text-muted-foreground hover:bg-accent hover:text-foreground"
        />
        <Separator orientation="vertical" className="h-5 bg-[#ded9cf]" />
        <span className="font-board text-base font-semibold">Workspace</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  );
}
