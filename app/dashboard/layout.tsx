import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/custom/app-header";
import { AppSidebar } from "@/components/custom/app-sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider className="min-h-screen bg-[#f8f7f4] text-[#1d1d1b]">
      <AppSidebar />
      <SidebarInset className="bg-[#f8f7f4]">
        <AppHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

