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
import { actividadesRecientes, resumenHoy, usuarioDemo } from "@/lib/data/mock";

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
  const primerNombre = usuarioDemo.nombre.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Saludo */}
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {saludoPorHora()}, {primerNombre} 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Este es el resumen de hoy en el centro infantil.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Párvulos matriculados"
          value={resumenHoy.matriculados}
          hint="Activos este mes"
          icon={RiUserSmileLine}
          accent="primary"
        />
        <StatCard
          label="Asistencia de hoy"
          value={`${resumenHoy.presentes}/${resumenHoy.matriculados}`}
          hint={`${resumenHoy.ausentes} ausentes · ${resumenHoy.atrasados} atrasados`}
          icon={RiGroupLine}
          accent="success"
        />
        <StatCard
          label="Mensajes sin leer"
          value={resumenHoy.mensajesSinLeer}
          hint="De apoderados y dirección"
          icon={RiMailLine}
          accent="warning"
        />
        <StatCard
          label="Próximo evento"
          value={resumenHoy.proximoEvento.fechaTexto}
          hint={resumenHoy.proximoEvento.titulo}
          icon={RiCalendarEventLine}
          accent="primary"
        />
      </div>

      {/* Chart + actividades */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading">Asistencia semanal</CardTitle>
            <CardDescription>
              Presentes y ausentes de lunes a viernes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyAttendanceChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Actividad reciente</CardTitle>
            <CardDescription>Últimos movimientos del equipo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {actividadesRecientes.map((actividad) => {
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
                      {actividad.hora}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
