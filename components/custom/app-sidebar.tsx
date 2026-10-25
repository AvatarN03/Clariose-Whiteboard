import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Archive, LayoutDashboard, PanelsTopLeft, Plus, Settings2, Sparkles, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";

type SidebarLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

const workspaceLinks: SidebarLink[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, active: true },
  { label: "All boards", href: "/dashboard", icon: PanelsTopLeft },
  { label: "Shared", href: "/dashboard", icon: Users },
  { label: "Archive", href: "/dashboard", icon: Archive },
];

const utilityLinks: SidebarLink[] = [
  { label: "AI helper", href: "/dashboard", icon: Sparkles },
  { label: "Settings", href: "/dashboard", icon: Settings2 },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-[#ded9cf] bg-[#f3f0e9]">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#1d1d1b] text-xs font-bold text-white">A</span>
          <span className="font-board text-lg font-semibold tracking-[-0.03em] group-data-[collapsible=icon]:hidden">Agente</span>
        </Link>
        <SidebarMenu className="mt-5">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Create board"
              render={<Button className="w-full justify-start bg-[#ec6338] text-white hover:bg-[#d9562d]" />}
            >
              <Plus size={17} strokeWidth={2.5} />
              <span>Create board</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarSection label="Workspace" links={workspaceLinks} />
        <SidebarSection label="Tools" links={utilityLinks} />
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-4" />
        <div className="flex items-center justify-between gap-3 px-2">
          <span className="text-xs text-[#756f65] group-data-[collapsible=icon]:hidden">Account</span>
          <UserButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarSection({ label, links }: { label: string; links: SidebarLink[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {links.map(({ label: linkLabel, href, icon: Icon, active }) => (
            <SidebarMenuItem key={linkLabel}>
              <SidebarMenuButton isActive={active} tooltip={linkLabel} render={<Link href={href} />}>
                <Icon />
                <span>{linkLabel}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
