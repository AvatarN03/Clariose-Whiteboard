"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Archive, PanelsTopLeft, Plus, Settings2, Sparkles, Users } from "lucide-react";
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
};

const workspaceLinks: SidebarLink[] = [
  { label: "All boards", href: "/dashboard", icon: PanelsTopLeft },
  { label: "Shared", href: "/dashboard/shared", icon: Users },
  { label: "Archive", href: "/dashboard/archive", icon: Archive },
];

const utilityLinks: SidebarLink[] = [
  { label: "AI helper", href: "/dashboard/ai-helper", icon: Sparkles },
  { label: "Settings", href: "/dashboard/settings", icon: Settings2 },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-[#ded9cf] bg-[#f3f0e9]">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <Link
          href="/dashboard"
          aria-label="Go to dashboard"
          title="Go to dashboard"
          className="flex items-center justify-start gap-2.5 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#1d1d1b] text-white" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-5" fill="none">
              <path d="M5 7.5 12 4l7 3.5v9L12 20l-7-3.5v-9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="m5.5 8 6.5 3.5L18.5 8M12 11.5V20" stroke="#ec6338" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-board text-lg font-semibold tracking-[-0.03em] group-data-[collapsible=icon]:hidden">Agente</span>
        </Link>
        <SidebarMenu className="mt-5">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Create board"
              className="cursor-pointer justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
              render={<Button className="app-sidebar-create-button w-full" />}
            >
              <Plus size={17} strokeWidth={2.5} />
              <span className="group-data-[collapsible=icon]:hidden">Create board</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarSection label="Workspace" links={workspaceLinks} pathname={pathname} />
        <SidebarSection label="Tools" links={utilityLinks} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter className="rounded-t-2xl bg-[#1d1d1b] p-3 text-white group-data-[collapsible=icon]:p-2">
        <SidebarSeparator className="mb-3 bg-white/15" />
        <div className="flex min-h-9 items-center justify-between gap-3 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="text-xs font-medium text-white/70 group-data-[collapsible=icon]:hidden">Account</span>
          <UserButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarSection({
  label,
  links,
  pathname,
}: {
  label: string;
  links: SidebarLink[];
  pathname: string;
}) {
  return (
    <SidebarGroup className="py-4">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-2">
          {links.map(({ label: linkLabel, href, icon: Icon }) => (
            <SidebarMenuItem key={linkLabel}>
              <SidebarMenuButton
                isActive={pathname === href}
                tooltip={linkLabel}
                className="cursor-pointer justify-start data-active:bg-[#ec6338] data-active:text-white data-active:hover:bg-[#d9562d] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:hover:bg-[#e7e2d9] group-data-[collapsible=icon]:data-active:bg-[#ec6338] group-data-[collapsible=icon]:data-active:hover:bg-[#d9562d]"
                render={<Link href={href} aria-label={linkLabel} />}
              >
                <Icon />
                <span className="group-data-[collapsible=icon]:hidden">{linkLabel}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
