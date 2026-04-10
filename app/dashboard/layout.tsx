import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <TooltipProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
            {children}

            <Toaster richColors />
          </main>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
