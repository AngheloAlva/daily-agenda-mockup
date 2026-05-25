"use client";

import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";
import {
  RiCalendarEventLine,
  RiCheckboxCircleLine,
  RiFileList3Line,
  RiGroupLine,
  RiMailLine,
  RiMessage3Line,
  RiUserSmileLine,
} from "@remixicon/react";

import { StatCard } from "@/components/dashboard/stat-card";
import { WeeklyAttendanceChart } from "@/components/dashboard/weekly-attendance-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";
import { useDbQuery } from "@/lib/db/use-db-query";
import { useSesion } from "@/lib/db/sesion-context";
import { countActivosByCentro } from "@/lib/db/repositories/ninos";
import {
  getAsistenciaSemanal,
  getResumenDia,
} from "@/lib/db/repositories/asistencia";
import { contarNoLeidas } from "@/lib/db/repositories/mensajes";
import { getProximoEvento } from "@/lib/db/repositories/eventos";
import { listRecientes as listActividades } from "@/lib/db/repositories/actividades";

const saludoPorHora = () => {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 20) return "Buenas tardes";
  return "Buenas noches";
};

const iconoActividad = {
  informe: RiFileList3Line,
  mensaje: RiMessage3Line,
  asistencia: RiCheckboxCircleLine,
  evento: RiCalendarEventLine,
} as const;

export default function DashboardPage() {
  const { usuario, centroActivo, fechaHoyDemo, nowDemo } = useSesion();
  const usuarioId = usuario.id;
  const centroId = centroActivo.id;
  const fechaHoy = fechaHoyDemo;

  const matriculadosQuery = useDbQuery(
    (db) => countActivosByCentro(db, centroId),
    [centroId],
  );

  const resumenQuery = useDbQuery(
    async (db) =>
      fechaHoy == null
        ? { total: 0, presentes: 0, ausentes: 0, atrasados: 0, sinRegistro: 0 }
        : await getResumenDia(db, centroId, fechaHoy, null),
    [centroId, fechaHoy],
  );

  const noLeidasQuery = useDbQuery(
    (db) => contarNoLeidas(db, usuarioId),
    [usuarioId],
  );

  const proximoEventoQuery = useDbQuery(
    async (db) =>
      fechaHoy == null ? null : await getProximoEvento(db, centroId, fechaHoy),
    [centroId, fechaHoy],
  );

  const semanalQuery = useDbQuery(
    async (db) =>
      fechaHoy == null ? [] : await getAsistenciaSemanal(db, centroId, fechaHoy),
    [centroId, fechaHoy],
  );

  const actividadesQuery = useDbQuery(
    (db) => listActividades(db, centroId, 5),
    [centroId],
  );

  const primerNombre = usuario.nombre;
  const resumen = resumenQuery.data ?? {
    total: 0, presentes: 0, ausentes: 0, atrasados: 0, sinRegistro: 0,
  };
  const proximoEvento = proximoEventoQuery.data;
  const semanal = semanalQuery.data ?? [];
  const actividades = actividadesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {saludoPorHora()}
          {primerNombre ? `, ${primerNombre}` : ""} 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Este es el resumen de hoy en el centro infantil.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardWithLoading
          label="Párvulos matriculados"
          value={matriculadosQuery.data ?? 0}
          hint="Activos este mes"
          icon={RiUserSmileLine}
          accent="primary"
          loading={matriculadosQuery.loading}
        />
        <StatCardWithLoading
          label="Asistencia de hoy"
          value={
            resumen.total > 0
              ? `${resumen.presentes}/${resumen.total}`
              : "—"
          }
          hint={`${resumen.ausentes} ausentes · ${resumen.atrasados} atrasados`}
          icon={RiGroupLine}
          accent="success"
          loading={resumenQuery.loading}
        />
        <StatCardWithLoading
          label="Mensajes sin leer"
          value={noLeidasQuery.data ?? 0}
          hint="De apoderados y dirección"
          icon={RiMailLine}
          accent="warning"
          loading={noLeidasQuery.loading}
        />
        <StatCardWithLoading
          label="Próximo evento"
          value={proximoEvento?.fechaTexto ?? "Sin eventos"}
          hint={proximoEvento?.titulo ?? "No hay eventos próximos"}
          icon={RiCalendarEventLine}
          accent="primary"
          loading={proximoEventoQuery.loading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading">Asistencia semanal</CardTitle>
            <CardDescription>
              Últimos 5 días hábiles — presentes y ausentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {semanalQuery.loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <WeeklyAttendanceChart data={semanal} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Actividad reciente</CardTitle>
            <CardDescription>Últimos movimientos del equipo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {actividadesQuery.loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))
            ) : actividades.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Sin actividad reciente
              </p>
            ) : (
              actividades.map((actividad) => {
                const Icon = iconoActividad[actividad.tipo];
                return (
                  <div key={actividad.id} className="flex items-start gap-3">
                    <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate text-sm font-medium">
                        {actividad.titulo}
                      </p>
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {actividad.descripcion}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDistance(new Date(actividad.fecha), nowDemo, {
                          locale: es,
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCardWithLoading({
  loading,
  ...props
}: React.ComponentProps<typeof StatCard> & { loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="size-11 rounded-xl" />
        </CardContent>
      </Card>
    );
  }
  return <StatCard {...props} />;
}
