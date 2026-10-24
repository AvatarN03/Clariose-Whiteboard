import Link from "next/link";
import {
  MessageSquare,
  MoreHorizontal,
  Plus,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const chats = [
  { title: "New conversation", href: "/dashboard" },
  { title: "Project planning", href: "/dashboard?chat=project-planning" },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
            >
              <>
                <MessageSquare />
                <span className="font-semibold">Chat workspace</span>
              </>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/dashboard?new=true" />}>
                  <>
                    <Plus />
                    <span>New chat</span>
                  </>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.href}>
                  <SidebarMenuButton render={<Link href={chat.href} />}>
                    <>
                      <MessageSquare />
                      <span>{chat.title}</span>
                    </>
                  </SidebarMenuButton>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More options</span>
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard/settings" />}>
              <>
                <Settings />
                <span>Settings</span>
              </>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
