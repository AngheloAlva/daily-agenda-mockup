import { RiNotification3Line, RiSearchLine } from "@remixicon/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usuarioDemo } from "@/lib/data/mock";

export function DashboardHeader() {
  return (
    <header className="bg-background sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 !h-5" />

      <div className="relative hidden max-w-sm flex-1 md:block">
        <RiSearchLine className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          placeholder="Buscar párvulo, mensaje, evento…"
          className="pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
          <RiNotification3Line className="size-5" />
          <span className="bg-destructive absolute top-1.5 right-1.5 size-2 rounded-full" />
        </Button>

        <Separator orientation="vertical" className="mx-1 !h-8" />

        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-sm font-medium">{usuarioDemo.nombre}</div>
            <div className="text-muted-foreground text-xs capitalize">
              {usuarioDemo.cargo}
            </div>
          </div>
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {usuarioDemo.iniciales}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
