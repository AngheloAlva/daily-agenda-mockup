"use client";

import { useState } from "react";
import { RiArrowDownSLine, RiShieldStarLine } from "@remixicon/react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSesionEstado } from "@/lib/db/sesion-context";
import type { Usuario } from "@/lib/db/types";

const ROL_LABEL: Record<Usuario["rol"], string> = {
  directora: "Dirección",
  docente: "Educadoras",
  apoderado: "Apoderados",
};

export function UserBadge() {
  const sesion = useSesionEstado();
  const [open, setOpen] = useState(false);

  if (sesion.status !== "ready") {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden text-right leading-tight sm:block">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-1 h-3 w-20" />
        </div>
        <Skeleton className="size-9 rounded-full" />
      </div>
    );
  }

  const { usuario, usuarios, centros, cambiarUsuario } = sesion;

  const iniciales =
    `${usuario.nombre[0] ?? ""}${usuario.apellido[0] ?? ""}`.toUpperCase();

  const centroNombrePorId = new Map(centros.map((c) => [c.id, c.nombre]));

  // Agrupar por rol (super_admin primero, después directora/docente/apoderado)
  const grupos: { label: string; usuarios: Usuario[] }[] = [];
  const superAdmins = usuarios.filter((u) => u.superAdmin);
  if (superAdmins.length > 0) {
    grupos.push({ label: "Coordinación regional", usuarios: superAdmins });
  }
  for (const rol of ["directora", "docente", "apoderado"] as const) {
    const lista = usuarios.filter((u) => !u.superAdmin && u.rol === rol);
    if (lista.length > 0) {
      // Apoderados pueden ser muchos — limitamos para no inflar el menú
      grupos.push({
        label: ROL_LABEL[rol],
        usuarios: rol === "apoderado" ? lista.slice(0, 6) : lista,
      });
    }
  }

  const onSeleccionar = async (id: number, nombre: string) => {
    if (id === usuario.id) return;
    setOpen(false);
    try {
      await cambiarUsuario(id);
      toast.success(`Sesión cambiada a ${nombre}`);
    } catch {
      toast.error("No se pudo cambiar de usuario");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto gap-2 px-2 py-1.5"
          aria-label="Cambiar usuario"
        >
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-sm font-medium">
              {usuario.nombre} {usuario.apellido}
            </div>
            {usuario.cargo && (
              <div className="text-muted-foreground text-xs capitalize">
                {usuario.cargo}
              </div>
            )}
          </div>
          <Avatar className="size-9">
            <AvatarFallback
              className={cn(
                "text-xs font-semibold",
                usuario.superAdmin
                  ? "bg-amber-500 text-white"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {iniciales}
            </AvatarFallback>
          </Avatar>
          <RiArrowDownSLine className="text-muted-foreground size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          Cambiar de usuario (demo)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {grupos.map((g, gi) => (
          <DropdownMenuGroup key={g.label}>
            <DropdownMenuLabel className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
              {g.label}
            </DropdownMenuLabel>
            {g.usuarios.map((u) => {
              const seleccionado = u.id === usuario.id;
              const subtitulo = u.superAdmin
                ? "Acceso a todos los centros"
                : u.cargo ??
                  (u.centroId != null ? centroNombrePorId.get(u.centroId) : "");
              return (
                <DropdownMenuItem
                  key={u.id}
                  onSelect={(e) => {
                    e.preventDefault();
                    void onSeleccionar(u.id, `${u.nombre} ${u.apellido}`);
                  }}
                  className={cn(
                    "flex items-center gap-2",
                    seleccionado && "bg-muted",
                  )}
                >
                  <Avatar className="size-7 shrink-0">
                    <AvatarFallback
                      className={cn(
                        "text-[10px] font-semibold",
                        u.superAdmin
                          ? "bg-amber-500 text-white"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      {u.nombre[0]}
                      {u.apellido[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {u.nombre} {u.apellido}
                    </p>
                    {subtitulo && (
                      <p className="text-muted-foreground truncate text-xs">
                        {subtitulo}
                      </p>
                    )}
                  </div>
                  {u.superAdmin && (
                    <RiShieldStarLine className="text-amber-500 size-4 shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
            {gi < grupos.length - 1 && <DropdownMenuSeparator />}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
