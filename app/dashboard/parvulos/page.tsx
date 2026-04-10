"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  RiArrowRightLine,
  RiCake2Line,
  RiCheckLine,
  RiSearchLine,
  RiTimeLine,
  RiUserSmileLine,
} from "@remixicon/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  calcularEdad,
  diasHastaCumple,
  inicialesDe,
  ninos,
  salas,
} from "@/lib/data/mock";

const TODAS = "todas";

export default function ParvulosPage() {
  const [busqueda, setBusqueda] = useState("");
  const [salaFiltro, setSalaFiltro] = useState<string>(TODAS);

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return ninos.filter((n) => {
      const matchSala = salaFiltro === TODAS || n.sala === salaFiltro;
      const matchQ =
        !q ||
        `${n.nombre} ${n.apellido}`.toLowerCase().includes(q) ||
        n.apoderado.toLowerCase().includes(q);
      return matchSala && matchQ;
    });
  }, [busqueda, salaFiltro]);

  const activos = ninos.filter((n) => n.estadoCuenta === "activo").length;
  const pendientes = ninos.length - activos;

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Párvulos
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Fichas completas de los {ninos.length} párvulos matriculados.
        </p>
      </div>

      {/* Stats resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 ">
            <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
              <RiUserSmileLine className="size-5" />
            </div>
            <div>
              <p className="font-heading text-2xl font-semibold">
                {ninos.length}
              </p>
              <p className="text-muted-foreground text-xs">
                Párvulos matriculados
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 ">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <RiCheckLine className="size-5" />
            </div>
            <div>
              <p className="font-heading text-2xl font-semibold">{activos}</p>
              <p className="text-muted-foreground text-xs">
                Apoderados con cuenta activa
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 ">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <RiTimeLine className="size-5" />
            </div>
            <div>
              <p className="font-heading text-2xl font-semibold">
                {pendientes}
              </p>
              <p className="text-muted-foreground text-xs">
                Cuentas pendientes de activación
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <RiSearchLine className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre del párvulo o apoderado…"
            className="pl-9"
          />
        </div>
        <Select value={salaFiltro} onValueChange={setSalaFiltro}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas las salas</SelectItem>
            {salas.map((s) => (
              <SelectItem key={s.id} value={s.nombre}>
                {s.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de tarjetas */}
      {lista.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground flex flex-col items-center gap-2 p-12 text-center">
            <RiUserSmileLine className="size-10 opacity-40" />
            <p className="text-sm">
              No se encontraron párvulos con esos criterios
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lista.map((nino) => {
            const edad = calcularEdad(nino.fechaNacimiento);
            const dias = diasHastaCumple(nino.fechaNacimiento);
            const cumpleProximo = dias <= 14;

            return (
              <Link
                key={nino.id}
                href={`/dashboard/parvulos/${nino.id}`}
                className="group"
              >
                <Card className="hover:border-primary/40 hover:shadow-md h-full transition-all">
                  <CardContent className="flex flex-col items-center gap-3 text-center">
                    <div className="relative">
                      <Avatar className="ring-background size-20 ring-4">
                        <AvatarFallback className="bg-primary/10 text-primary font-heading text-xl font-semibold">
                          {inicialesDe(nino.nombre, nino.apellido)}
                        </AvatarFallback>
                      </Avatar>
                      {cumpleProximo && (
                        <span
                          className="absolute -top-1 -right-1 flex size-7 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm"
                          title={
                            dias === 0
                              ? "¡Cumple hoy!"
                              : `Cumple en ${dias} días`
                          }
                        >
                          <RiCake2Line className="size-4" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-heading truncate font-semibold">
                        {nino.nombre} {nino.apellido}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {edad.texto}
                      </p>
                    </div>

                    <Badge variant="secondary" className="text-xs">
                      {nino.sala}
                    </Badge>

                    <div className="bg-muted/40 w-full rounded-md px-3 py-2 text-left">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
                        Apoderado
                      </p>
                      <p className="truncate text-xs font-medium">
                        {nino.apoderado}
                      </p>
                    </div>

                    <div className="flex w-full items-center justify-between">
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 text-[10px]",
                          nino.estadoCuenta === "activo"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400",
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            nino.estadoCuenta === "activo"
                              ? "bg-emerald-500"
                              : "bg-amber-500",
                          )}
                        />
                        {nino.estadoCuenta === "activo"
                          ? "Cuenta activa"
                          : "Pendiente"}
                      </Badge>
                      <RiArrowRightLine className="text-muted-foreground group-hover:text-primary size-4 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
