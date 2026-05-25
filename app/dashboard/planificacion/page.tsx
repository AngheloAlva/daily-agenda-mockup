"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  RiBookOpenLine,
  RiCheckLine,
  RiCheckboxCircleFill,
  RiDraftLine,
  RiTargetLine,
  RiTimeLine,
} from "@remixicon/react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ambitoConfig,
  estadoPlanificacionConfig,
} from "@/lib/utils/planificacion";
import { useDbQuery } from "@/lib/db/use-db-query";
import { useDbMutation } from "@/lib/db/use-db-mutation";
import { useSesion } from "@/lib/db/sesion-context";
import { listByCentro as listSalas } from "@/lib/db/repositories/salas";
import {
  getById,
  getResumen,
  listByCentro,
  toggleExperienciaRealizada,
} from "@/lib/db/repositories/planificaciones";
import type {
  Experiencia,
  PlanificacionResumen,
} from "@/lib/db/types";

const TODAS = -1;

export default function PlanificacionPage() {
  const { centroActivo } = useSesion();
  const centroId = centroActivo.id;

  const [salaActivaId, setSalaActivaId] = useState<number>(TODAS);

  const salasQuery = useDbQuery((db) => listSalas(db, centroId), [centroId]);

  const listaQuery = useDbQuery(
    (db) =>
      listByCentro(
        db,
        centroId,
        salaActivaId === TODAS ? null : salaActivaId,
      ),
    [centroId, salaActivaId],
  );

  const resumenQuery = useDbQuery(
    (db) => getResumen(db, centroId),
    [centroId],
  );

  const salas = salasQuery.data ?? [];
  const lista = listaQuery.data ?? [];
  const resumen = resumenQuery.data ?? {
    total: 0, borrador: 0, aprobada: 0, archivada: 0,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Planificación curricular
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Planes pedagógicos por sala, alineados con las Bases Curriculares de
          Educación Parvularia.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total de planes"
          value={resumen.total}
          hint="En todas las salas"
          color="primary"
          icon={RiBookOpenLine}
          loading={resumenQuery.loading}
        />
        <StatCard
          label="Aprobadas"
          value={resumen.aprobada}
          hint="Vigentes este periodo"
          color="emerald"
          icon={RiCheckboxCircleFill}
          loading={resumenQuery.loading}
        />
        <StatCard
          label="En borrador"
          value={resumen.borrador}
          hint="Pendientes de aprobación"
          color="sky"
          icon={RiDraftLine}
          loading={resumenQuery.loading}
        />
      </div>

      <Tabs
        value={String(salaActivaId)}
        onValueChange={(v) => setSalaActivaId(Number(v))}
      >
        <TabsList>
          <TabsTrigger value={String(TODAS)}>Todas las salas</TabsTrigger>
          {salas.map((s) => (
            <TabsTrigger key={s.id} value={String(s.id)}>
              {s.nombre}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {listaQuery.loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground flex flex-col items-center gap-2 p-12 text-center">
            <RiBookOpenLine className="size-10 opacity-40" />
            <p className="text-sm">
              No hay planificaciones registradas en esta sala todavía.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion
          type="multiple"
          className="flex flex-col gap-4 border-none"
        >
          {lista.map((p) => (
            <PlanificacionCard key={p.id} planificacion={p} />
          ))}
        </Accordion>
      )}
    </div>
  );
}

function PlanificacionCard({
  planificacion,
}: {
  planificacion: PlanificacionResumen;
}) {
  const ambito = ambitoConfig[planificacion.ambito];
  const estado = estadoPlanificacionConfig[planificacion.estado];

  const inicio = parseISO(planificacion.periodoInicio);
  const fin = parseISO(planificacion.periodoFin);

  const porcentaje =
    planificacion.totalExperiencias === 0
      ? 0
      : Math.round(
          (planificacion.experienciasRealizadas /
            planificacion.totalExperiencias) *
            100,
        );

  return (
    <AccordionItem
      value={String(planificacion.id)}
      className="bg-card overflow-hidden rounded-xl border"
    >
      <AccordionTrigger className="px-5 hover:no-underline">
        <div className="flex flex-1 flex-col items-start gap-3 pr-3 text-left">
          <div className="flex w-full flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("gap-1.5", ambito.bg, ambito.text)}>
              <span className={cn("size-1.5 rounded-full", ambito.dot)} />
              {ambito.label}
            </Badge>
            <Badge variant="outline" className={estado.className}>
              {estado.label}
            </Badge>
            <Badge variant="secondary" className="ml-auto">
              {planificacion.salaNombre}
            </Badge>
          </div>

          <div className="w-full">
            <h3 className="font-heading text-base font-semibold">
              {planificacion.titulo}
            </h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {format(inicio, "d 'de' MMMM", { locale: es })} –{" "}
              {format(fin, "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>

          <div className="flex w-full items-center gap-3">
            <Progress value={porcentaje} className="h-1.5 flex-1" />
            <span className="text-muted-foreground shrink-0 text-xs">
              {planificacion.experienciasRealizadas}/
              {planificacion.totalExperiencias} experiencias
            </span>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="border-t px-5 pt-4 pb-5">
        <PlanificacionDetalleContent planificacionId={planificacion.id} />
      </AccordionContent>
    </AccordionItem>
  );
}

function PlanificacionDetalleContent({
  planificacionId,
}: {
  planificacionId: number;
}) {
  const detalleQuery = useDbQuery(
    (db) => getById(db, planificacionId),
    [planificacionId],
  );

  const toggleMut = useDbMutation(
    (db, args: { experienciaId: number; realizada: boolean }) =>
      toggleExperienciaRealizada(db, args.experienciaId, args.realizada),
  );

  const onToggle = async (id: number, realizada: boolean) => {
    try {
      await toggleMut.mutate({ experienciaId: id, realizada });
      detalleQuery.refetch();
    } catch {
      toast.error("No se pudo actualizar la experiencia");
    }
  };

  if (detalleQuery.loading || !detalleQuery.data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const detalle = detalleQuery.data;

  return (
    <div className="space-y-5">
      <div className="bg-muted/40 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <RiTargetLine className="text-primary mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              Objetivo general
            </p>
            <p className="text-sm leading-relaxed">{detalle.objetivoGeneral}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <p className="text-muted-foreground">
          Creada por{" "}
          <span className="text-foreground font-medium">
            {detalle.autorNombre}
          </span>
          {detalle.aprobadaPor && (
            <>
              {" · "}aprobada por{" "}
              <span className="text-foreground font-medium">
                {detalle.aprobadaPor}
              </span>
            </>
          )}
        </p>
      </div>

      <div>
        <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
          Experiencias de aprendizaje
        </p>
        {detalle.experiencias.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Sin experiencias planificadas todavía.
          </p>
        ) : (
          <div className="space-y-3">
            {detalle.experiencias.map((e) => (
              <ExperienciaCard
                key={e.id}
                experiencia={e}
                onToggle={(realizada) => void onToggle(e.id, realizada)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExperienciaCard({
  experiencia,
  onToggle,
}: {
  experiencia: Experiencia;
  onToggle: (realizada: boolean) => void;
}) {
  const fecha = parseISO(experiencia.fecha);

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        experiencia.realizada
          ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20"
          : "bg-card",
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={experiencia.realizada}
          onCheckedChange={(v) => onToggle(Boolean(v))}
          className="mt-0.5"
          aria-label={
            experiencia.realizada
              ? "Marcar como no realizada"
              : "Marcar como realizada"
          }
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h4
              className={cn(
                "text-sm font-semibold",
                experiencia.realizada && "text-muted-foreground line-through",
              )}
            >
              {experiencia.titulo}
            </h4>
            <span className="text-muted-foreground text-xs capitalize">
              {format(fecha, "EEE d 'de' MMM", { locale: es })}
            </span>
            {experiencia.duracionMin && (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <RiTimeLine className="size-3" />
                {experiencia.duracionMin} min
              </span>
            )}
            {experiencia.realizada && (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
              >
                <RiCheckLine className="size-3" />
                Realizada
              </Badge>
            )}
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            {experiencia.descripcion}
          </p>

          {experiencia.materiales.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                Materiales:
              </span>
              {experiencia.materiales.map((m) => (
                <Badge key={m} variant="outline" className="text-[10px]">
                  {m}
                </Badge>
              ))}
            </div>
          )}

          {experiencia.evaluacion && (
            <div className="bg-muted/40 rounded p-2 text-xs">
              <span className="font-semibold">Evaluación: </span>
              {experiencia.evaluacion}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  color,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  hint: string;
  color: "primary" | "emerald" | "sky";
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
}) {
  const styles: Record<typeof color, string> = {
    primary: "bg-primary/10 text-primary",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
  };

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          {loading ? (
            <Skeleton className="h-9 w-12" />
          ) : (
            <p className="font-heading text-3xl font-semibold tracking-tight">
              {value}
            </p>
          )}
          <p className="text-muted-foreground text-xs">{hint}</p>
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            styles[color],
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
