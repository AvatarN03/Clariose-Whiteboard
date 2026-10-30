import { Suspense } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/custom/app-header";
import { AppSidebar } from "@/components/custom/app-sidebar";
import { AuthGate } from "@/components/custom/auth-gate";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={null}>
      <AuthGate>
        <SidebarProvider className="min-h-screen bg-background text-foreground">
          <AppSidebar />
          <SidebarInset className="bg-background">
            <AppHeader />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </AuthGate>
    </Suspense>
  );
}
