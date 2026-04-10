"use client";

import { useMemo, useState } from "react";
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
import {
  inicialesDe,
  ninos as ninosBase,
  salas,
  type EstadoAsistencia,
  type Nino,
} from "@/lib/data/mock";

type NinoConRetiro = Nino & { retiroHora?: string };

const TODAS = "todas";

const estadoConfig: Record<
  EstadoAsistencia,
  { label: string; dot: string; badge: string }
> = {
  presente: {
    label: "Presente",
    dot: "bg-emerald-500",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  ausente: {
    label: "Ausente",
    dot: "bg-rose-500",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400",
  },
  atrasado: {
    label: "Atrasado",
    dot: "bg-amber-500",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400",
  },
};

export default function AsistenciaPage() {
  const [fecha, setFecha] = useState<Date>(new Date());
  const [salaActiva, setSalaActiva] = useState<string>(TODAS);
  const [lista, setLista] = useState<NinoConRetiro[]>(ninosBase);

  // Dialog de retiro anticipado
  const [retiroOpen, setRetiroOpen] = useState(false);
  const [retiroNinoId, setRetiroNinoId] = useState<number | null>(null);
  const [retiroHora, setRetiroHora] = useState<string>("");

  const ninosFiltrados = useMemo(
    () =>
      salaActiva === TODAS ? lista : lista.filter((n) => n.sala === salaActiva),
    [lista, salaActiva],
  );

  const resumen = useMemo(() => {
    const base = { presente: 0, ausente: 0, atrasado: 0 };
    ninosFiltrados.forEach((n) => {
      base[n.estadoHoy] += 1;
    });
    return base;
  }, [ninosFiltrados]);

  const total = ninosFiltrados.length;
  const porcentajePresentes =
    total > 0 ? Math.round((resumen.presente / total) * 100) : 0;

  const cambiarEstado = (id: number, estado: EstadoAsistencia) => {
    setLista((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, estadoHoy: estado, retiroHora: undefined } : n,
      ),
    );
  };

  const abrirRetiro = (id: number) => {
    const ahora = new Date();
    setRetiroNinoId(id);
    setRetiroHora(
      `${ahora.getHours().toString().padStart(2, "0")}:${ahora
        .getMinutes()
        .toString()
        .padStart(2, "0")}`,
    );
    setRetiroOpen(true);
  };

  const confirmarRetiro = () => {
    if (retiroNinoId === null || !retiroHora) return;
    setLista((prev) =>
      prev.map((n) =>
        n.id === retiroNinoId ? { ...n, retiroHora, estadoHoy: "presente" } : n,
      ),
    );
    const nino = lista.find((n) => n.id === retiroNinoId);
    toast.success("Retiro anticipado registrado", {
      description: `${nino?.nombre ?? "Párvulo"} fue retirado a las ${retiroHora}.`,
    });
    setRetiroOpen(false);
    setRetiroNinoId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Asistencia diaria
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Registra la asistencia de los párvulos y gestiona retiros
            anticipados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start gap-2">
                <RiCalendarLine className="size-4" />
                <span className="capitalize">
                  {format(fecha, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={fecha}
                onSelect={(d) => d && setFecha(d)}
                locale={es}
                autoFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            aria-label="Exportar reporte"
            onClick={() =>
              toast.info("Exportando reporte…", {
                description: "El archivo CSV se generará en breve.",
              })
            }
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

      {/* Stat cards del día */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-start justify-between gap-3 ">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm font-medium">
                Total del filtro
              </p>
              <p className="font-heading text-3xl font-semibold tracking-tight">
                {total}
              </p>
              <p className="text-muted-foreground text-xs">
                {salaActiva === TODAS
                  ? "Todas las salas"
                  : `Sala: ${salaActiva}`}
              </p>
            </div>
            <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
              <RiUserSmileLine className="size-5" />
            </div>
          </CardContent>
        </Card>

        <EstadoCard
          label="Presentes"
          value={resumen.presente}
          hint={`${porcentajePresentes}% de asistencia`}
          icon={RiCheckboxCircleFill}
          tono="emerald"
        />
        <EstadoCard
          label="Ausentes"
          value={resumen.ausente}
          hint="Sin notificación registrada"
          icon={RiCloseCircleFill}
          tono="rose"
        />
        <EstadoCard
          label="Atrasados"
          value={resumen.atrasado}
          hint="Ingreso posterior al horario"
          icon={RiTimeFill}
          tono="amber"
        />
      </div>

      {/* Tabla por sala */}
      <Card>
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="font-heading">
                Listado de párvulos
              </CardTitle>
              <CardDescription>
                Haz click en el estado para actualizarlo
              </CardDescription>
            </div>

            <Tabs value={salaActiva} onValueChange={setSalaActiva}>
              <TabsList>
                <TabsTrigger value={TODAS}>Todas</TabsTrigger>
                {salas.map((s) => (
                  <TabsTrigger key={s.id} value={s.nombre}>
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
                <TableHead className="hidden md:table-cell">
                  Apoderado
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ninosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No hay párvulos en esta sala.
                  </TableCell>
                </TableRow>
              ) : (
                ninosFiltrados.map((nino) => {
                  const cfg = estadoConfig[nino.estadoHoy];
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
                              {nino.sala}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm">{nino.sala}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-muted-foreground text-sm">
                          {nino.apoderado}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <ToggleGroup
                            type="single"
                            size="sm"
                            value={nino.estadoHoy}
                            onValueChange={(v) =>
                              v && cambiarEstado(nino.id, v as EstadoAsistencia)
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

                          {nino.retiroHora && (
                            <Badge
                              variant="outline"
                              className={cn("gap-1 text-xs", cfg.badge)}
                            >
                              <RiLogoutBoxRLine className="size-3" />
                              Retirado {nino.retiroHora}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirRetiro(nino.id)}
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

      {/* Dialog retiro anticipado */}
      <Dialog open={retiroOpen} onOpenChange={setRetiroOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar retiro anticipado</DialogTitle>
            <DialogDescription>
              Indica la hora en que el párvulo fue retirado por su apoderado.
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
            <Button onClick={confirmarRetiro} disabled={!retiroHora}>
              Confirmar retiro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Subcomponente local: stat card con tono ---------- */

type EstadoCardProps = {
  label: string;
  value: number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tono: "emerald" | "rose" | "amber";
};

const tonoStyles: Record<EstadoCardProps["tono"], string> = {
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
};

function EstadoCard({ label, value, hint, icon: Icon, tono }: EstadoCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 ">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="font-heading text-3xl font-semibold tracking-tight">
            {value}
          </p>
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
