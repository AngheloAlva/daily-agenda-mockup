"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  RiCalendarLine,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiDownload2Line,
  RiLogoutBoxRLine,
  RiPrinterLine,
  RiTimeFill,
  RiUserSmileLine,
} from "@remixicon/react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { inicialesDe } from "@/lib/utils/nino";
import { useDbQuery } from "@/lib/db/use-db-query";
import { useDbMutation } from "@/lib/db/use-db-mutation";
import { useDbContext } from "@/lib/db/provider";
import { useSesion } from "@/lib/db/sesion-context";
import { generarAsistenciaMensual } from "@/lib/reports";
import { listByCentro as listSalas } from "@/lib/db/repositories/salas";
import {
  getResumenDia,
  listAsistenciaDelDia,
  registrarRetiro,
  upsertEstado,
} from "@/lib/db/repositories/asistencia";
import type { EstadoAsistencia, NinoConAsistencia } from "@/lib/db/types";

const TODAS = -1;

const estadoConfig: Record<
  EstadoAsistencia,
  { label: string; badge: string }
> = {
  presente: {
    label: "Presente",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  ausente: {
    label: "Ausente",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400",
  },
  atrasado: {
    label: "Atrasado",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400",
  },
  retirado: {
    label: "Retirado",
    badge:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-900 dark:bg-slate-950/40 dark:text-slate-400",
  },
};

const toISODate = (d: Date) => format(d, "yyyy-MM-dd");

export default function AsistenciaPage() {
  const dbCtx = useDbContext();
  const { usuario, centroActivo, fechaHoyDemo } = useSesion();
  const usuarioId = usuario.id;
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const centroId = centroActivo.id;

  const [fecha, setFecha] = useState<Date | null>(null);
  const [salaActivaId, setSalaActivaId] = useState<number>(TODAS);

  // Inicializa la fecha cuando llega la del demo
  useEffect(() => {
    if (!fecha && fechaHoyDemo) {
      setFecha(new Date(`${fechaHoyDemo}T00:00:00`));
    }
  }, [fecha, fechaHoyDemo]);

  const fechaIso = fecha ? toISODate(fecha) : null;
  const salaIdParam = salaActivaId === TODAS ? null : salaActivaId;

  const salasQuery = useDbQuery((db) => listSalas(db, centroId), [centroId]);

  const listaQuery = useDbQuery(
    async (db) =>
      fechaIso == null
        ? []
        : await listAsistenciaDelDia(db, centroId, fechaIso, salaIdParam),
    [centroId, fechaIso, salaIdParam],
  );

  const resumenQuery = useDbQuery(
    async (db) =>
      fechaIso == null
        ? { total: 0, presentes: 0, ausentes: 0, atrasados: 0, sinRegistro: 0 }
        : await getResumenDia(db, centroId, fechaIso, salaIdParam),
    [centroId, fechaIso, salaIdParam],
  );

  const upsertMut = useDbMutation(
    (
      db,
      args: { ninoId: number; fecha: string; estado: EstadoAsistencia; usuarioId: number },
    ) => upsertEstado(db, args),
  );
  const retiroMut = useDbMutation(
    (
      db,
      args: {
        ninoId: number;
        fecha: string;
        horaRetiro: string;
        retiradoPor: string | null;
        usuarioId: number;
      },
    ) => registrarRetiro(db, args),
  );

  // Dialog de retiro
  const [retiroOpen, setRetiroOpen] = useState(false);
  const [retiroNino, setRetiroNino] = useState<NinoConAsistencia | null>(null);
  const [retiroHora, setRetiroHora] = useState<string>("");

  const salas = salasQuery.data ?? [];
  const lista = listaQuery.data ?? [];
  const resumen = resumenQuery.data ?? {
    total: 0, presentes: 0, ausentes: 0, atrasados: 0, sinRegistro: 0,
  };
  const porcentajePresentes =
    resumen.total > 0 ? Math.round((resumen.presentes / resumen.total) * 100) : 0;

  const cargandoFecha = !fecha;
  const cargandoLista = listaQuery.loading || cargandoFecha;

  const cambiarEstado = async (ninoId: number, estado: EstadoAsistencia) => {
    if (!fechaIso) return;
    try {
      await upsertMut.mutate({ ninoId, fecha: fechaIso, estado, usuarioId });
      listaQuery.refetch();
      resumenQuery.refetch();
    } catch {
      toast.error("No se pudo registrar el estado");
    }
  };

  const abrirRetiro = (nino: NinoConAsistencia) => {
    const ahora = new Date();
    setRetiroNino(nino);
    setRetiroHora(
      `${ahora.getHours().toString().padStart(2, "0")}:${ahora
        .getMinutes()
        .toString()
        .padStart(2, "0")}`,
    );
    setRetiroOpen(true);
  };

  const confirmarRetiro = async () => {
    if (!retiroNino || !retiroHora || !fechaIso) return;
    try {
      await retiroMut.mutate({
        ninoId: retiroNino.id,
        fecha: fechaIso,
        horaRetiro: retiroHora,
        retiradoPor: retiroNino.apoderado,
        usuarioId,
      });
      listaQuery.refetch();
      resumenQuery.refetch();
      toast.success("Retiro anticipado registrado", {
        description: `${retiroNino.nombre} fue retirado a las ${retiroHora}.`,
      });
      setRetiroOpen(false);
      setRetiroNino(null);
    } catch {
      toast.error("No se pudo registrar el retiro");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Asistencia diaria
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Registra la asistencia de los párvulos y gestiona retiros anticipados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start gap-2" disabled={cargandoFecha}>
                <RiCalendarLine className="size-4" />
                <span className="capitalize">
                  {fecha
                    ? format(fecha, "EEEE d 'de' MMMM, yyyy", { locale: es })
                    : "Cargando fecha…"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={fecha ?? undefined}
                onSelect={(d) => d && setFecha(d)}
                locale={es}
                autoFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            aria-label="Exportar reporte del mes"
            disabled={exportandoPdf || !fecha || dbCtx.status !== "ready"}
            onClick={async () => {
              if (!fecha || dbCtx.status !== "ready") return;
              setExportandoPdf(true);
              try {
                const nombre = await generarAsistenciaMensual(
                  { db: dbCtx.db, centro: centroActivo, usuario },
                  fecha.getFullYear(),
                  fecha.getMonth() + 1,
                );
                toast.success("Reporte generado", { description: nombre });
              } catch (e) {
                toast.error("No se pudo generar el reporte", {
                  description: e instanceof Error ? e.message : undefined,
                });
              } finally {
                setExportandoPdf(false);
              }
            }}
          >
            <RiDownload2Line className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Imprimir"
            onClick={() =>
              toast.info("Preparando impresión…", {
                description: "Se abrirá el diálogo del navegador.",
              })
            }
          >
            <RiPrinterLine className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm font-medium">
                Total del filtro
              </p>
              {resumenQuery.loading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                <p className="font-heading text-3xl font-semibold tracking-tight">
                  {resumen.total}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                {salaActivaId === TODAS
                  ? "Todas las salas"
                  : `Sala: ${salas.find((s) => s.id === salaActivaId)?.nombre ?? ""}`}
              </p>
            </div>
            <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
              <RiUserSmileLine className="size-5" />
            </div>
          </CardContent>
        </Card>

        <EstadoCard
          label="Presentes"
          value={resumen.presentes}
          hint={`${porcentajePresentes}% de asistencia`}
          icon={RiCheckboxCircleFill}
          tono="emerald"
          loading={resumenQuery.loading}
        />
        <EstadoCard
          label="Ausentes"
          value={resumen.ausentes}
          hint={
            resumen.sinRegistro > 0
              ? `+ ${resumen.sinRegistro} sin registro`
              : "Sin notificación registrada"
          }
          icon={RiCloseCircleFill}
          tono="rose"
          loading={resumenQuery.loading}
        />
        <EstadoCard
          label="Atrasados"
          value={resumen.atrasados}
          hint="Ingreso posterior al horario"
          icon={RiTimeFill}
          tono="amber"
          loading={resumenQuery.loading}
        />
      </div>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="font-heading">Listado de párvulos</CardTitle>
              <CardDescription>
                Haz click en el estado para actualizarlo
              </CardDescription>
            </div>

            <Tabs
              value={String(salaActivaId)}
              onValueChange={(v) => setSalaActivaId(Number(v))}
            >
              <TabsList>
                <TabsTrigger value={String(TODAS)}>Todas</TabsTrigger>
                {salas.map((s) => (
                  <TabsTrigger key={s.id} value={String(s.id)}>
                    {s.nombre}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Párvulo</TableHead>
                <TableHead className="hidden md:table-cell">Sala</TableHead>
                <TableHead className="hidden md:table-cell">Apoderado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargandoLista ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : lista.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No hay párvulos en esta sala.
                  </TableCell>
                </TableRow>
              ) : (
                lista.map((nino) => {
                  const cfg = nino.estado ? estadoConfig[nino.estado] : null;
                  return (
                    <TableRow key={nino.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-muted text-xs font-semibold">
                              {inicialesDe(nino.nombre, nino.apellido)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {nino.nombre} {nino.apellido}
                            </div>
                            <div className="text-muted-foreground truncate text-xs md:hidden">
                              {nino.salaNombre}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm">{nino.salaNombre}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-muted-foreground text-sm">
                          {nino.apoderado ?? "Sin apoderado"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <ToggleGroup
                            type="single"
                            size="sm"
                            value={nino.estado ?? ""}
                            onValueChange={(v) =>
                              v && void cambiarEstado(nino.id, v as EstadoAsistencia)
                            }
                            className="bg-muted/40 rounded-md p-0.5"
                          >
                            <ToggleGroupItem
                              value="presente"
                              aria-label="Presente"
                              className="data-[state=on]:bg-emerald-500 data-[state=on]:text-white"
                            >
                              <span className="flex items-center gap-1.5 text-xs">
                                <span className="size-1.5 rounded-full bg-current" />
                                Presente
                              </span>
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="ausente"
                              aria-label="Ausente"
                              className="data-[state=on]:bg-rose-500 data-[state=on]:text-white"
                            >
                              <span className="flex items-center gap-1.5 text-xs">
                                <span className="size-1.5 rounded-full bg-current" />
                                Ausente
                              </span>
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="atrasado"
                              aria-label="Atrasado"
                              className="data-[state=on]:bg-amber-500 data-[state=on]:text-white"
                            >
                              <span className="flex items-center gap-1.5 text-xs">
                                <span className="size-1.5 rounded-full bg-current" />
                                Atrasado
                              </span>
                            </ToggleGroupItem>
                          </ToggleGroup>

                          {nino.horaRetiro && cfg && (
                            <Badge
                              variant="outline"
                              className={cn("gap-1 text-xs", cfg.badge)}
                            >
                              <RiLogoutBoxRLine className="size-3" />
                              Retirado {nino.horaRetiro.slice(0, 5)}
                            </Badge>
                          )}

                          {!nino.estado && (
                            <span className="text-muted-foreground text-xs">
                              Sin registro todavía
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirRetiro(nino)}
                          className="gap-1.5"
                        >
                          <RiLogoutBoxRLine className="size-4" />
                          <span className="hidden sm:inline">
                            Retiro anticipado
                          </span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={retiroOpen} onOpenChange={setRetiroOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar retiro anticipado</DialogTitle>
            <DialogDescription>
              {retiroNino
                ? `Indica la hora en que ${retiroNino.nombre} ${retiroNino.apellido} fue retirado/a por ${retiroNino.apoderado ?? "su apoderado"}.`
                : "Indica la hora en que el párvulo fue retirado por su apoderado."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="hora-retiro">Hora de retiro</Label>
            <Input
              id="hora-retiro"
              type="time"
              value={retiroHora}
              onChange={(e) => setRetiroHora(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRetiroOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void confirmarRetiro()}
              disabled={!retiroHora || retiroMut.loading}
            >
              {retiroMut.loading ? "Guardando…" : "Confirmar retiro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type EstadoCardProps = {
  label: string;
  value: number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tono: "emerald" | "rose" | "amber";
  loading: boolean;
};

const tonoStyles: Record<EstadoCardProps["tono"], string> = {
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
};

function EstadoCard({ label, value, hint, icon: Icon, tono, loading }: EstadoCardProps) {
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
            tonoStyles[tono],
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
