"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBellLine,
  RiCalendarEventLine,
  RiMapPin2Line,
  RiTimeLine,
  RiVideoLine,
} from "@remixicon/react";
import { toast } from "sonner";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { tipoEventoConfig } from "@/lib/utils/eventos";
import { useDbQuery } from "@/lib/db/use-db-query";
import { useDbMutation } from "@/lib/db/use-db-mutation";
import { useSesion } from "@/lib/db/sesion-context";
import { listByCentro as listSalas } from "@/lib/db/repositories/salas";
import {
  crear as crearEvento,
  listByRango,
  listProximos,
} from "@/lib/db/repositories/eventos";
import type { Evento, TipoEvento } from "@/lib/db/types";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const ISO = (d: Date) => format(d, "yyyy-MM-dd");

export default function CalendarioPage() {
  const { usuario, centroActivo, fechaHoyDemo } = useSesion();
  const usuarioId = usuario.id;
  const centroId = centroActivo.id;

  const [mesActual, setMesActual] = useState<Date | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Inicializa el mes y el día seleccionado a la "fecha demo" (max asistencia)
  useEffect(() => {
    if (mesActual == null && fechaHoyDemo) {
      const d = new Date(`${fechaHoyDemo}T00:00:00`);
      setMesActual(d);
      setDiaSeleccionado(d);
    }
  }, [mesActual, fechaHoyDemo]);

  const fechaHoyIso = fechaHoyDemo;

  // Rango visible = semanas completas que contienen al mesActual
  const rango = useMemo(() => {
    if (!mesActual) return null;
    const inicio = startOfWeek(startOfMonth(mesActual), { weekStartsOn: 1 });
    const fin = endOfWeek(endOfMonth(mesActual), { weekStartsOn: 1 });
    return { inicio, fin };
  }, [mesActual]);

  const diasGrid = useMemo(
    () =>
      rango
        ? eachDayOfInterval({ start: rango.inicio, end: rango.fin })
        : [],
    [rango],
  );

  const eventosRangoQuery = useDbQuery(
    async (db) =>
      rango == null
        ? []
        : await listByRango(db, centroId, ISO(rango.inicio), ISO(rango.fin)),
    [centroId, rango?.inicio.getTime(), rango?.fin.getTime()],
  );

  const proximosQuery = useDbQuery(
    async (db) =>
      fechaHoyIso == null
        ? []
        : await listProximos(db, centroId, fechaHoyIso, 5),
    [centroId, fechaHoyIso],
  );

  const salasQuery = useDbQuery(
    (db) => listSalas(db, centroId),
    [centroId],
  );

  const crearMut = useDbMutation(
    (
      db,
      args: Parameters<typeof crearEvento>[1],
    ) => crearEvento(db, args),
  );

  const eventosRango = eventosRangoQuery.data ?? [];
  const proximos = proximosQuery.data ?? [];
  const salas = salasQuery.data ?? [];

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, Evento[]>();
    for (const e of eventosRango) {
      const lista = map.get(e.fecha) ?? [];
      lista.push(e);
      map.set(e.fecha, lista);
    }
    return map;
  }, [eventosRango]);

  const getEventosDia = (date: Date): Evento[] =>
    eventosPorDia.get(format(date, "yyyy-MM-dd")) ?? [];

  const eventosDelSeleccionado = diaSeleccionado
    ? getEventosDia(diaSeleccionado)
    : [];

  const cantidadEsteMes = mesActual
    ? eventosRango.filter((e) =>
        isSameMonth(parseISO(e.fecha), mesActual),
      ).length
    : 0;

  const onCrearEvento = async (
    payload: Omit<Parameters<typeof crearEvento>[1], "centroId" | "createdBy">,
  ) => {
    // sesion siempre lista aquí
    try {
      await crearMut.mutate({
        centroId,
        createdBy: usuarioId,
        ...payload,
      });
      eventosRangoQuery.refetch();
      proximosQuery.refetch();
      toast.success("Evento creado", { description: payload.titulo });
    } catch {
      toast.error("No se pudo crear el evento");
    }
  };

  const irHoy = () => {
    if (!fechaHoyIso) return;
    const d = new Date(`${fechaHoyIso}T00:00:00`);
    setMesActual(d);
    setDiaSeleccionado(d);
  };

  const cargando = !mesActual;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              Calendario
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Eventos institucionales, actividades y feriados del centro.
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="gap-2"
            disabled={cargando}
          >
            <RiAddLine className="size-4" />
            Nuevo evento
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
              <div>
                <CardTitle className="font-heading text-xl capitalize">
                  {mesActual
                    ? format(mesActual, "MMMM yyyy", { locale: es })
                    : "Cargando…"}
                </CardTitle>
                <CardDescription>
                  {eventosRangoQuery.loading
                    ? "Cargando eventos…"
                    : `${cantidadEsteMes} eventos este mes`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={irHoy}
                  disabled={cargando}
                >
                  Hoy
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => mesActual && setMesActual(subMonths(mesActual, 1))}
                  disabled={cargando}
                  aria-label="Mes anterior"
                >
                  <RiArrowLeftSLine className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => mesActual && setMesActual(addMonths(mesActual, 1))}
                  disabled={cargando}
                  aria-label="Mes siguiente"
                >
                  <RiArrowRightSLine className="size-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-3 md:p-4">
              <div className="mb-2 grid grid-cols-7 gap-1">
                {DIAS_SEMANA.map((d) => (
                  <div
                    key={d}
                    className="text-muted-foreground py-1 text-center text-xs font-semibold uppercase"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {cargando ? (
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="min-h-[72px] md:min-h-[92px]" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {diasGrid.map((dia) => (
                    <DiaCell
                      key={dia.toISOString()}
                      dia={dia}
                      mesActual={mesActual!}
                      fechaHoyIso={fechaHoyIso ?? null}
                      seleccionado={
                        diaSeleccionado
                          ? isSameDay(dia, diaSeleccionado)
                          : false
                      }
                      eventos={getEventosDia(dia)}
                      onClick={() => setDiaSeleccionado(dia)}
                    />
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3 border-t pt-3">
                {(Object.keys(tipoEventoConfig) as TipoEvento[]).map((tipo) => {
                  const cfg = tipoEventoConfig[tipo];
                  return (
                    <div key={tipo} className="flex items-center gap-1.5">
                      <span className={cn("size-2 rounded-full", cfg.dot)} />
                      <span className="text-muted-foreground text-xs">
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="font-heading text-base capitalize">
                  {diaSeleccionado
                    ? format(diaSeleccionado, "EEEE d 'de' MMMM", { locale: es })
                    : "Día"}
                </CardTitle>
                <CardDescription>
                  {eventosDelSeleccionado.length === 0
                    ? "Sin eventos programados"
                    : `${eventosDelSeleccionado.length} evento(s)`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                {eventosDelSeleccionado.length === 0 ? (
                  <div className="text-muted-foreground flex flex-col items-center gap-2 py-6 text-center text-sm">
                    <RiCalendarEventLine className="size-8 opacity-40" />
                    <p>Día libre</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eventosDelSeleccionado.map((e) => (
                      <EventoCard key={e.id} evento={e} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle className="font-heading text-base">
                  Próximos eventos
                </CardTitle>
                <CardDescription>Sin contar feriados</CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                {proximosQuery.loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : proximos.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center text-sm">
                    No hay eventos próximos
                  </p>
                ) : (
                  <div className="space-y-2">
                    {proximos.map((e) => (
                      <EventoCard key={e.id} evento={e} compact />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {diaSeleccionado && (
        <NuevoEventoDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          fechaInicial={diaSeleccionado}
          salas={salas}
          onCrear={onCrearEvento}
          creando={crearMut.loading}
        />
      )}
    </>
  );
}

function DiaCell({
  dia,
  mesActual,
  fechaHoyIso,
  seleccionado,
  eventos,
  onClick,
}: {
  dia: Date;
  mesActual: Date;
  fechaHoyIso: string | null;
  seleccionado: boolean;
  eventos: Evento[];
  onClick: () => void;
}) {
  const esMesActual = isSameMonth(dia, mesActual);
  // "Hoy" en el demo no es new Date(), sino la fecha demo
  const hoy = fechaHoyIso
    ? isSameDay(dia, parseISO(fechaHoyIso))
    : isToday(dia);
  const tieneEventos = eventos.length > 0;
  const esFeriado = eventos.some((e) => e.tipo === "feriado");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group hover:bg-muted/50 relative flex min-h-[72px] flex-col items-stretch rounded-lg border p-1.5 text-left transition-colors md:min-h-[92px]",
        !esMesActual && "opacity-40",
        seleccionado
          ? "border-primary bg-primary/5 hover:bg-primary/10"
          : "border-transparent",
        esFeriado && !seleccionado && "bg-rose-50/50 dark:bg-rose-950/20",
      )}
    >
      <div
        className={cn(
          "mb-1 flex size-6 items-center justify-center rounded-full text-xs font-semibold",
          hoy && "bg-primary text-primary-foreground",
          seleccionado && !hoy && "text-primary",
          !hoy && !seleccionado && "text-foreground",
        )}
      >
        {format(dia, "d")}
      </div>

      <div className="flex-1 space-y-0.5 overflow-hidden">
        {eventos.slice(0, 2).map((e) => {
          const cfg = tipoEventoConfig[e.tipo];
          return (
            <div
              key={e.id}
              className={cn(
                "hidden truncate rounded px-1 py-0.5 text-[10px] font-medium md:block",
                cfg.bg,
                cfg.text,
              )}
            >
              {e.horaInicio && <span>{e.horaInicio} </span>}
              {e.titulo}
            </div>
          );
        })}
        {eventos.length > 2 && (
          <div className="text-muted-foreground hidden text-[10px] md:block">
            +{eventos.length - 2} más
          </div>
        )}
      </div>

      {tieneEventos && (
        <div className="mt-auto flex justify-center gap-0.5 md:hidden">
          {eventos.slice(0, 4).map((e) => {
            const cfg = tipoEventoConfig[e.tipo];
            return (
              <span
                key={e.id}
                className={cn("size-1.5 rounded-full", cfg.dot)}
              />
            );
          })}
        </div>
      )}
    </button>
  );
}

function EventoCard({
  evento,
  compact = false,
}: {
  evento: Evento;
  compact?: boolean;
}) {
  const cfg = tipoEventoConfig[evento.tipo];
  const fecha = parseISO(evento.fecha);

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        cfg.bg,
        cfg.border,
      )}
    >
      <div className="flex items-start gap-2">
        <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", cfg.dot)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn("truncate text-sm font-semibold", cfg.text)}>
              {evento.titulo}
            </h3>
            {evento.recordatorio && (
              <RiBellLine
                className={cn("size-3 shrink-0", cfg.text)}
                aria-label="Con recordatorio"
              />
            )}
          </div>

          {!compact && evento.descripcion && (
            <p className="text-muted-foreground mt-1 text-xs">
              {evento.descripcion}
            </p>
          )}

          <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
            {compact && (
              <span className="font-medium capitalize">
                {format(fecha, "EEE d MMM", { locale: es })}
              </span>
            )}
            {evento.horaInicio && (
              <span className="inline-flex items-center gap-1">
                <RiTimeLine className="size-3" />
                {evento.horaInicio}
                {evento.horaFin && `–${evento.horaFin}`}
              </span>
            )}
            {evento.modalidad === "online" ? (
              <span className="inline-flex items-center gap-1">
                <RiVideoLine className="size-3" />
                Online
              </span>
            ) : (
              evento.ubicacion && (
                <span className="inline-flex items-center gap-1">
                  <RiMapPin2Line className="size-3" />
                  {evento.ubicacion}
                </span>
              )
            )}
          </div>

          {!compact && evento.alcanceSalaNombre && (
            <Badge variant="outline" className="mt-2 text-[10px]">
              {evento.alcanceSalaNombre}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function NuevoEventoDialog({
  open,
  onOpenChange,
  fechaInicial,
  salas,
  onCrear,
  creando,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fechaInicial: Date;
  salas: { id: number; nombre: string }[];
  onCrear: (
    args: Omit<Parameters<typeof crearEvento>[1], "centroId" | "createdBy">,
  ) => Promise<void> | void;
  creando: boolean;
}) {
  const uid = useId();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(format(fechaInicial, "yyyy-MM-dd"));
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("10:00");
  const [tipo, setTipo] = useState<TipoEvento>("reunion");
  const [modalidad, setModalidad] = useState<"presencial" | "online">(
    "presencial",
  );
  const [ubicacion, setUbicacion] = useState("");
  const [alcanceSala, setAlcanceSala] = useState<string>("general");
  const [recordatorio, setRecordatorio] = useState(true);

  // Cuando se reabre el dialog con una nueva fecha inicial, actualizarla
  useEffect(() => {
    if (open) {
      setFecha(format(fechaInicial, "yyyy-MM-dd"));
    }
  }, [open, fechaInicial]);

  const reset = () => {
    setTitulo("");
    setDescripcion("");
    setHoraInicio("09:00");
    setHoraFin("10:00");
    setTipo("reunion");
    setModalidad("presencial");
    setUbicacion("");
    setAlcanceSala("general");
    setRecordatorio(true);
  };

  const crear = async () => {
    if (!titulo.trim() || !fecha) {
      toast.error("Completa el título y la fecha");
      return;
    }
    const salaId =
      alcanceSala === "general" ? null : Number(alcanceSala);
    await onCrear({
      titulo,
      descripcion: descripcion || null,
      fecha,
      horaInicio: horaInicio || null,
      horaFin: horaFin || null,
      tipo,
      modalidad,
      ubicacion: modalidad === "presencial" ? ubicacion || null : null,
      alcanceSalaId: salaId,
      recordatorio,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Nuevo evento</DialogTitle>
          <DialogDescription>
            Programa una reunión, actividad o celebración del centro.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${uid}-titulo`}>Título</Label>
            <Input
              id={`${uid}-titulo`}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Reunión de apoderados"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${uid}-descripcion`}>Descripción</Label>
            <Textarea
              id={`${uid}-descripcion`}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles del evento…"
              rows={3}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor={`${uid}-fecha`}>Fecha</Label>
              <Input
                id={`${uid}-fecha`}
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${uid}-inicio`}>Hora inicio</Label>
              <Input
                id={`${uid}-inicio`}
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${uid}-fin`}>Hora fin</Label>
              <Input
                id={`${uid}-fin`}
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${uid}-tipo`}>Tipo</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setTipo(v as TipoEvento)}
              >
                <SelectTrigger id={`${uid}-tipo`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(tipoEventoConfig) as TipoEvento[])
                    .filter((t) => t !== "feriado")
                    .map((t) => (
                      <SelectItem key={t} value={t}>
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              tipoEventoConfig[t].dot,
                            )}
                          />
                          {tipoEventoConfig[t].label}
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${uid}-modalidad`}>Modalidad</Label>
              <Select
                value={modalidad}
                onValueChange={(v) => setModalidad(v as "presencial" | "online")}
              >
                <SelectTrigger id={`${uid}-modalidad`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${uid}-alcance`}>Dirigido a</Label>
              <Select value={alcanceSala} onValueChange={setAlcanceSala}>
                <SelectTrigger id={`${uid}-alcance`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  {salas.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {modalidad === "presencial" && (
            <div className="space-y-2">
              <Label htmlFor={`${uid}-ubicacion`}>Ubicación</Label>
              <Input
                id={`${uid}-ubicacion`}
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ej: Salón principal"
              />
            </div>
          )}

          <label className="bg-muted/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3">
            <Checkbox
              checked={recordatorio}
              onCheckedChange={(v) => setRecordatorio(Boolean(v))}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Recordatorio automático</p>
              <p className="text-muted-foreground text-xs">
                Se enviará notificación a los apoderados 24 horas antes.
              </p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
            disabled={creando}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void crear()}
            className="gap-1.5"
            disabled={creando}
          >
            <RiCalendarEventLine className="size-4" />
            {creando ? "Creando…" : "Crear evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
