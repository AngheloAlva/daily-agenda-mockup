"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  RiLoader4Line,
  RiShieldStarLine,
  RiArrowRightLine,
} from "@remixicon/react";

import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getDb } from "@/lib/db/client";
import { setUsuarioActivo, setCentroActivo } from "@/lib/db/repositories/sesion";
import { listParaSwitcher } from "@/lib/db/repositories/usuarios";
import type { Usuario } from "@/lib/db/types";

const ROL_GROUPS: { label: string; description: string; tono: string }[] = [
  {
    label: "Coordinación regional",
    description: "Acceso a todos los centros",
    tono: "border-amber-200 bg-amber-50/40 dark:border-amber-900",
  },
  {
    label: "Dirección de centro",
    description: "Acceso completo al centro asignado",
    tono: "border-primary/30 bg-primary/5",
  },
  {
    label: "Educadora",
    description: "Sala, asistencia, informes",
    tono: "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900",
  },
  {
    label: "Apoderado",
    description: "Vista de su hijo/a",
    tono: "border-sky-200 bg-sky-50/40 dark:border-sky-900",
  },
];

const grupoIndexParaUsuario = (u: Usuario): number => {
  if (u.superAdmin) return 0;
  if (u.rol === "directora") return 1;
  if (u.rol === "docente") return 2;
  return 3;
};

export default function LoginPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [ingresandoId, setIngresandoId] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const db = await getDb();
        const lista = await listParaSwitcher(db);
        setUsuarios(lista);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    })();
  }, []);

  const ingresar = async (u: Usuario) => {
    setIngresandoId(u.id);
    try {
      const db = await getDb();
      await setUsuarioActivo(db, u.id);
      if (!u.superAdmin && u.centroId != null) {
        await setCentroActivo(db, u.centroId);
      }
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setIngresandoId(null);
    }
  };

  // Agrupar para render
  const grupos: { idx: number; usuarios: Usuario[] }[] = [];
  if (usuarios) {
    for (let i = 0; i < ROL_GROUPS.length; i++) {
      const us = usuarios.filter((u) => grupoIndexParaUsuario(u) === i);
      if (us.length > 0) grupos.push({ idx: i, usuarios: us });
    }
  }

  return (
    <div className="from-primary/10 via-background to-background relative flex min-h-screen flex-1 items-center justify-center bg-gradient-to-br p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
      >
        <div className="bg-primary/20 absolute -top-24 -left-24 size-72 rounded-full blur-3xl" />
        <div className="bg-chart-1/30 absolute right-0 -bottom-32 size-96 rounded-full blur-3xl" />
      </div>

      <Card className="relative z-10 w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Logo showText={false} className="scale-125" />
          </div>
          <div className="space-y-1">
            <CardTitle className="font-heading text-2xl">
              Semillitas del Oriente
            </CardTitle>
            <CardDescription>
              Aula · Elegí un perfil para entrar al demo
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {error ? (
            <div className="text-destructive text-sm text-center py-8">
              No se pudo cargar el demo: {error.message}
            </div>
          ) : !usuarios ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {grupos.map((g) => {
                const cfg = ROL_GROUPS[g.idx];
                return (
                  <div key={g.idx}>
                    <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wide">
                      {cfg.label} · {cfg.description}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {g.usuarios.slice(0, 4).map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => void ingresar(u)}
                          disabled={ingresandoId !== null}
                          className={cn(
                            "group hover:border-primary/40 hover:shadow-sm flex items-center gap-3 rounded-lg border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60",
                            cfg.tono,
                          )}
                        >
                          <Avatar className="size-10 shrink-0">
                            <AvatarFallback
                              className={cn(
                                "text-xs font-semibold",
                                u.superAdmin
                                  ? "bg-amber-500 text-white"
                                  : "bg-primary text-primary-foreground",
                              )}
                            >
                              {u.nombre[0]}
                              {u.apellido[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {u.nombre} {u.apellido}
                            </p>
                            {u.cargo && (
                              <p className="text-muted-foreground truncate text-xs">
                                {u.cargo}
                              </p>
                            )}
                          </div>
                          {ingresandoId === u.id ? (
                            <RiLoader4Line className="text-muted-foreground size-4 animate-spin" />
                          ) : u.superAdmin ? (
                            <RiShieldStarLine className="text-amber-500 size-4 shrink-0" />
                          ) : (
                            <RiArrowRightLine className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-colors" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-muted-foreground mt-6 text-center text-xs">
            Servicio de Salud Metropolitano Oriente ·{" "}
            <Link
              href="#"
              className="underline-offset-2 hover:underline"
              onClick={(e) => e.preventDefault()}
            >
              Demo offline
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
