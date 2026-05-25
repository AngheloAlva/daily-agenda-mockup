import { RiCloudOffLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CentroSelector } from "@/components/dashboard/centro-selector";
import { NotificacionesPopover } from "@/components/dashboard/notificaciones-popover";
import { ResetDemoButton } from "@/components/dashboard/reset-demo-button";
import { UserBadge } from "@/components/dashboard/user-badge";

export function DashboardHeader() {
  return (
    <header className="bg-background sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 !h-5" />

      <Badge
        variant="outline"
        className="hidden gap-1.5 text-[11px] font-medium sm:inline-flex"
        title="Toda la información vive en este navegador (PGlite + IndexedDB). No hay servidor."
      >
        <RiCloudOffLine className="size-3" />
        Demo offline
      </Badge>

      <div className="ml-auto flex items-center gap-2">
        <CentroSelector />

        <ResetDemoButton />

        <NotificacionesPopover />

        <Separator orientation="vertical" className="mx-1 !h-8" />

        <UserBadge />
      </div>
    </header>
  );
}
