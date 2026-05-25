"use client";

import { useState } from "react";
import { RiBuilding4Line, RiCheckLine } from "@remixicon/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useSesionEstado } from "@/lib/db/sesion-context";

// Solo visible para usuarios super_admin (coordinación regional).
// Permite alternar entre centros para ver las KPIs cruzadas.
export function CentroSelector() {
  const sesion = useSesionEstado();
  const [open, setOpen] = useState(false);

  if (sesion.status !== "ready") return null;
  if (!sesion.esSuperAdmin) return null;

  const { centroActivo, centros, cambiarCentro } = sesion;

  const onSeleccionar = async (id: number, nombre: string) => {
    if (id === centroActivo.id) return;
    setOpen(false);
    try {
      await cambiarCentro(id);
      toast.success(`Viendo ${nombre}`);
    } catch {
      toast.error("No se pudo cambiar de centro");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RiBuilding4Line className="size-4" />
          <span className="max-w-[180px] truncate">
            {centroActivo.nombre}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          Centro activo (vista regional)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {centros.map((c) => {
          const activo = c.id === centroActivo.id;
          return (
            <DropdownMenuItem
              key={c.id}
              onSelect={(e) => {
                e.preventDefault();
                void onSeleccionar(c.id, c.nombre);
              }}
              className={cn("flex items-start gap-2", activo && "bg-muted")}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.nombre}</p>
                {c.comuna && (
                  <p className="text-muted-foreground truncate text-xs">
                    {c.comuna}
                  </p>
                )}
              </div>
              {activo && (
                <RiCheckLine className="text-primary mt-0.5 size-4 shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
