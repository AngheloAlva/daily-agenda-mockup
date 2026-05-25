"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  RiBarChart2Line,
  RiFileChartLine,
  RiFilePdfLine,
  RiGroupLine,
  RiUserSmileLine,
} from "@remixicon/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useDbContext } from "@/lib/db/provider";
import { useDbQuery } from "@/lib/db/use-db-query";
import { useSesion } from "@/lib/db/sesion-context";
import { listByCentro as listNinos } from "@/lib/db/repositories/ninos";
import { listByCentro as listReportes } from "@/lib/db/repositories/reportes";
import type { TipoReporte } from "@/lib/db/repositories/reportes";
import {
  generarAsistenciaMensual,
  generarFichaParvulo,
  generarListaApoderados,
} from "@/lib/reports";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const tipoLabel: Record<TipoReporte, string> = {
  asistencia_mensual: "Asistencia mensual",
  asistencia_semanal: "Asistencia semanal",
  informe_parvulo: "Ficha del párvulo",
  lista_apoderados: "Lista de apoderados",
  estado_cuentas: "Estado de cuentas",
  planificacion_mensual: "Planificación mensual",
};

const tipoTono: Record<TipoReporte, string> = {
  asistencia_mensual: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  asistencia_semanal: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
  informe_parvulo: "bg-primary/10 text-primary",
  lista_apoderados: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
  estado_cuentas: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  planificacion_mensual: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
};

export default function ReportesPage() {
  const dbCtx = useDbContext();
  const { centroActivo, usuario, fechaHoyDemo } = useSesion();

  const ninosQuery = useDbQuery((db) => listNinos(db, centroActivo.id), [centroActivo.id]);
  const historialQuery = useDbQuery(
    (db) => listReportes(db, centroActivo.id, 15),
    [centroActivo.id],
  );

  // Defaults derivados de la fecha demo
  const fechaDefault = fechaHoyDemo
    ? new Date(`${fechaHoyDemo}T00:00:00`)
    : new Date();
  const [mesSel, setMesSel] = useState<number>(fechaDefault.getMonth() + 1);
  const [anioSel, setAnioSel] = useState<number>(fechaDefault.getFullYear());
  const [ninoSel, setNinoSel] = useState<string>("");
  const [generando, setGenerando] = useState<TipoReporte | null>(null);

  const ninos = ninosQuery.data ?? [];

  const ctxReporte = () => {
    if (dbCtx.status !== "ready") throw new Error("DB no lista");
    return { db: dbCtx.db, centro: centroActivo, usuario };
  };

  const onAsistenciaMensual = async () => {
    setGenerando("asistencia_mensual");
    try {
      const nombre = await generarAsistenciaMensual(ctxReporte(), anioSel, mesSel);
      historialQuery.refetch();
      toast.success("Reporte generado", { description: nombre });
    } catch (e) {
      toast.error("No se pudo generar el reporte", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setGenerando(null);
    }
  };

  const onListaApoderados = async () => {
    setGenerando("lista_apoderados");
    try {
      const nombre = await generarListaApoderados(ctxReporte());
      historialQuery.refetch();
      toast.success("Reporte generado", { description: nombre });
    } catch (e) {
      toast.error("No se pudo generar el reporte", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setGenerando(null);
    }
  };

  const onFichaParvulo = async () => {
    if (!ninoSel) {
      toast.error("Selecciona un párvulo");
      return;
    }
    setGenerando("informe_parvulo");
    try {
      const nombre = await generarFichaParvulo(ctxReporte(), Number(ninoSel));
      historialQuery.refetch();
      toast.success("Ficha generada", { description: nombre });
    } catch (e) {
      toast.error("No se pudo generar la ficha", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setGenerando(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Reportes
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Genera reportes PDF con los datos del centro. Quedan registrados en el
          historial.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Asistencia mensual */}
        <Card>
          <CardHeader>
            <div className={cn("flex size-11 items-center justify-center rounded-xl", tipoTono.asistencia_mensual)}>
              <RiBarChart2Line className="size-5" />
            </div>
            <CardTitle className="font-heading mt-3 text-base">
              Asistencia mensual
            </CardTitle>
            <CardDescription>
              Matriz por sala con asistencia diaria y totales por párvulo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={String(mesSel)}
                onValueChange={(v) => setMesSel(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(anioSel)}
                onValueChange={(v) => setAnioSel(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[anioSel - 1, anioSel, anioSel + 1].map((a) => (
                    <SelectItem key={a} value={String(a)}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full gap-1.5"
              onClick={() => void onAsistenciaMensual()}
              disabled={generando !== null}
            >
              <RiFilePdfLine className="size-4" />
              {generando === "asistencia_mensual" ? "Generando…" : "Generar PDF"}
            </Button>
          </CardContent>
        </Card>

        {/* Lista de apoderados */}
        <Card>
          <CardHeader>
            <div className={cn("flex size-11 items-center justify-center rounded-xl", tipoTono.lista_apoderados)}>
              <RiGroupLine className="size-5" />
            </div>
            <CardTitle className="font-heading mt-3 text-base">
              Lista de apoderados
            </CardTitle>
            <CardDescription>
              Datos de contacto y párvulos a cargo de cada apoderado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-xs">
              Incluye todos los apoderados activos del centro actual.
            </p>
            <Button
              className="w-full gap-1.5"
              onClick={() => void onListaApoderados()}
              disabled={generando !== null}
            >
              <RiFilePdfLine className="size-4" />
              {generando === "lista_apoderados" ? "Generando…" : "Generar PDF"}
            </Button>
          </CardContent>
        </Card>

        {/* Ficha del párvulo */}
        <Card>
          <CardHeader>
            <div className={cn("flex size-11 items-center justify-center rounded-xl", tipoTono.informe_parvulo)}>
              <RiUserSmileLine className="size-5" />
            </div>
            <CardTitle className="font-heading mt-3 text-base">
              Ficha del párvulo
            </CardTitle>
            <CardDescription>
              Datos personales, salud, familia y educativos en un PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={ninoSel} onValueChange={setNinoSel}>
              <SelectTrigger>
                <SelectValue placeholder={
                  ninosQuery.loading
                    ? "Cargando párvulos…"
                    : "Selecciona un párvulo"
                } />
              </SelectTrigger>
              <SelectContent>
                {ninos.map((n) => (
                  <SelectItem key={n.id} value={String(n.id)}>
                    {n.nombre} {n.apellido} — {n.salaNombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full gap-1.5"
              onClick={() => void onFichaParvulo()}
              disabled={generando !== null || !ninoSel}
            >
              <RiFilePdfLine className="size-4" />
              {generando === "informe_parvulo" ? "Generando…" : "Generar PDF"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2 text-base">
            <RiFileChartLine className="size-4" />
            Historial de reportes
          </CardTitle>
          <CardDescription>
            Últimos reportes generados desde este navegador.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {historialQuery.loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (historialQuery.data ?? []).length === 0 ? (
            <div className="text-muted-foreground py-12 text-center text-sm">
              Todavía no se ha generado ningún reporte.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead className="hidden md:table-cell">Generado por</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(historialQuery.data ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
                          tipoTono[r.tipo],
                        )}
                      >
                        {tipoLabel[r.tipo]}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.archivoNombre}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {r.generadoPorNombre}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {format(parseISO(r.fecha), "d MMM yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
