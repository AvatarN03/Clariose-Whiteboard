import { UserButton } from "@clerk/nextjs";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#ded9cf] bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
          className="text-[#615f59] hover:bg-[#f3f0e9] hover:text-[#1d1d1b]"
        />
        <Separator orientation="vertical" className="h-5 bg-[#ded9cf]" />
        <span className="font-board text-base font-semibold text-[#1d1d1b]">Workspace</span>
      </div>
      <UserButton />
    </header>
  );
}
