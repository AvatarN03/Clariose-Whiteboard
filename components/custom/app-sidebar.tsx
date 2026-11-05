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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { CreateBoardDialog } from "@/components/custom/create-board-dialog";
import { BrandLogo } from "@/components/custom/brand-logo";

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
    <Sidebar collapsible="icon" className="border-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <Link
          href="/dashboard"
          aria-label="Go to dashboard"
          title="Go to dashboard"
          className="flex items-center justify-start gap-2.5 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <BrandLogo nameClassName="group-data-[collapsible=icon]:hidden" />
        </Link>
        <SidebarMenu className="mt-5">
          <SidebarMenuItem>
            <CreateBoardDialog
              trigger={
                <SidebarMenuButton
                  size="lg"
                  tooltip="Create board"
                  className="cursor-pointer justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                  render={<Button className="app-sidebar-create-button w-full" />}
                >
                  <Plus size={17} strokeWidth={2.5} />
                  <span className="group-data-[collapsible=icon]:hidden">Create board</span>
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarSection label="Workspace" links={workspaceLinks} pathname={pathname} />
        <SidebarSection label="Tools" links={utilityLinks} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter className="rounded-t-2xl bg-sidebar-primary p-3 text-sidebar-primary-foreground dark:bg-[#f8f7f4] dark:text-[#1d1d1b] group-data-[collapsible=icon]:p-2">
        <div className="flex min-h-9 items-center justify-between gap-3 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="text-xs font-medium text-sidebar-primary-foreground/70 dark:text-[#615f59] group-data-[collapsible=icon]:hidden">Account</span>
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
                className="cursor-pointer justify-start data-active:bg-[#ec6338] data-active:text-white data-active:hover:bg-[#d9562d] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:hover:bg-sidebar-accent group-data-[collapsible=icon]:data-active:bg-[#ec6338] group-data-[collapsible=icon]:data-active:hover:bg-[#d9562d]"
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
