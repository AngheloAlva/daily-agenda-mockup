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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { calcularEdad, diasHastaCumple, inicialesDe } from "@/lib/utils/nino";
import { useDbQuery } from "@/lib/db/use-db-query";
import { listByCentro as listNinos, getConteoCuentas } from "@/lib/db/repositories/ninos";
import { listByCentro as listSalas } from "@/lib/db/repositories/salas";
import { useSesion } from "@/lib/db/sesion-context";

const TODAS = "todas";

export default function ParvulosPage() {
  const { centroActivo, nowDemo } = useSesion();
  const centroId = centroActivo.id;

  const ninosQuery = useDbQuery((db) => listNinos(db, centroId), [centroId]);
  const salasQuery = useDbQuery((db) => listSalas(db, centroId), [centroId]);
  const conteoQuery = useDbQuery(
    (db) => getConteoCuentas(db, centroId),
    [centroId],
  );

  const [busqueda, setBusqueda] = useState("");
  const [salaFiltro, setSalaFiltro] = useState<string>(TODAS);

  const ninos = ninosQuery.data ?? [];
  const salas = salasQuery.data ?? [];
  const conteo = conteoQuery.data ?? { activos: 0, pendientes: 0 };
  const totalMatriculados = conteo.activos + conteo.pendientes;

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return ninos.filter((n) => {
      const matchSala = salaFiltro === TODAS || n.salaNombre === salaFiltro;
      const matchQ =
        !q ||
        `${n.nombre} ${n.apellido}`.toLowerCase().includes(q) ||
        (n.apoderadoPrincipal?.toLowerCase().includes(q) ?? false);
      return matchSala && matchQ;
    });
  }, [busqueda, salaFiltro, ninos]);

  const cargando = ninosQuery.loading || salasQuery.loading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Párvulos
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {cargando
            ? "Cargando matrícula del centro…"
            : `Fichas completas de los ${totalMatriculados} párvulos matriculados.`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<RiUserSmileLine className="size-5" />}
          iconClass="bg-primary/10 text-primary"
          valor={totalMatriculados}
          label="Párvulos matriculados"
          loading={conteoQuery.loading}
        />
        <StatCard
          icon={<RiCheckLine className="size-5" />}
          iconClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          valor={conteo.activos}
          label="Apoderados con cuenta activa"
          loading={conteoQuery.loading}
        />
        <StatCard
          icon={<RiTimeLine className="size-5" />}
          iconClass="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
          valor={conteo.pendientes}
          label="Cuentas pendientes de activación"
          loading={conteoQuery.loading}
        />
      </div>

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

      {cargando ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col items-center gap-3 py-6">
                <Skeleton className="size-20 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : lista.length === 0 ? (
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
            const edad = calcularEdad(nino.fechaNacimiento, nowDemo);
            const dias = diasHastaCumple(nino.fechaNacimiento, nowDemo);
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
                      {nino.salaNombre}
                    </Badge>

                    <div className="bg-muted/40 w-full rounded-md px-3 py-2 text-left">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
                        Apoderado
                      </p>
                      <p className="truncate text-xs font-medium">
                        {nino.apoderadoPrincipal ?? "Sin asignar"}
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

function StatCard({
  icon,
  iconClass,
  valor,
  label,
  loading,
}: {
  icon: React.ReactNode;
  iconClass: string;
  valor: number;
  label: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl",
            iconClass,
          )}
        >
          {icon}
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-8 w-10" />
          ) : (
            <p className="font-heading text-2xl font-semibold">{valor}</p>
          )}
          <p className="text-muted-foreground text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
