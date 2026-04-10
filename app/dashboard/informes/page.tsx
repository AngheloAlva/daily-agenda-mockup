"use client";

import { useId, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  RiCalendarLine,
  RiCheckDoubleFill,
  RiDraftLine,
  RiEmotionHappyFill,
  RiEmotionHappyLine,
  RiEmotionNormalFill,
  RiEmotionNormalLine,
  RiEmotionSadFill,
  RiEmotionSadLine,
  RiImageAddLine,
  RiMoonLine,
  RiRestaurantLine,
  RiSendPlaneFill,
  RiTimeLine,
} from "@remixicon/react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { inicialesDe, ninos, salas, type Nino } from "@/lib/data/mock";

/* ---------- Tipos ---------- */

type EstadoInforme = "pendiente" | "borrador" | "publicado";
type Animo = "feliz" | "normal" | "triste" | "";

type Informe = {
  estado: EstadoInforme;
  alimentacion: { desayuno: boolean; almuerzo: boolean; once: boolean };
  siestaInicio: string;
  siestaFin: string;
  mudas: number;
  animo: Animo;
  actividades: string;
  observaciones: string;
  fotoCargada: boolean;
};

const informeVacio = (): Informe => ({
  estado: "pendiente",
  alimentacion: { desayuno: false, almuerzo: false, once: false },
  siestaInicio: "",
  siestaFin: "",
  mudas: 0,
  animo: "",
  actividades: "",
  observaciones: "",
  fotoCargada: false,
});

// Seed inicial con variedad de estados para el demo
const informesIniciales: Record<number, Informe> = {
  1: {
    // Sofía — publicado completo
    estado: "publicado",
    alimentacion: { desayuno: true, almuerzo: true, once: true },
    siestaInicio: "13:00",
    siestaFin: "14:30",
    mudas: 2,
    animo: "feliz",
    actividades:
      "Participó en actividad de motricidad fina con plasticinas. Exploración sensorial con texturas blandas.",
    observaciones:
      "Tuvo un excelente día. Respondió a su nombre en varias oportunidades.",
    fotoCargada: true,
  },
  2: {
    // Matías — borrador incompleto
    estado: "borrador",
    alimentacion: { desayuno: true, almuerzo: true, once: false },
    siestaInicio: "13:15",
    siestaFin: "14:00",
    mudas: 1,
    animo: "normal",
    actividades: "Exploración libre en el rincón de construcción.",
    observaciones: "",
    fotoCargada: false,
  },
};

const TODAS = "todas";

const estadoConfig: Record<
  EstadoInforme,
  { label: string; className: string }
> = {
  pendiente: {
    label: "Pendiente",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400",
  },
  borrador: {
    label: "Borrador",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-400",
  },
  publicado: {
    label: "Publicado",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
};

const animoEmoji: Record<Exclude<Animo, "">, string> = {
  feliz: "😊",
  normal: "😐",
  triste: "😢",
};

/* ---------- Página ---------- */

export default function InformesPage() {
  const [fecha, setFecha] = useState<Date>(new Date());
  const [salaActiva, setSalaActiva] = useState<string>(TODAS);
  const [informes, setInformes] =
    useState<Record<number, Informe>>(informesIniciales);

  // Niños presentes del día (ni ausentes) filtrados por sala
  const ninosPresentes = useMemo(
    () =>
      ninos
        .filter((n) => n.estadoHoy !== "ausente")
        .filter((n) => salaActiva === TODAS || n.sala === salaActiva),
    [salaActiva],
  );

  const getInforme = (id: number): Informe => informes[id] ?? informeVacio();

  const resumen = useMemo(() => {
    const base = { pendiente: 0, borrador: 0, publicado: 0 };
    ninosPresentes.forEach((n) => {
      const estado = informes[n.id]?.estado ?? "pendiente";
      base[estado] += 1;
    });
    return base;
  }, [ninosPresentes, informes]);

  const actualizar = (id: number, patch: Partial<Informe>) => {
    setInformes((prev) => ({
      ...prev,
      [id]: { ...getInforme(id), ...patch },
    }));
  };

  const guardarBorrador = (nino: Nino) => {
    actualizar(nino.id, { estado: "borrador" });
    toast.success("Borrador guardado", {
      description: `Informe de ${nino.nombre} guardado como borrador.`,
    });
  };

  const publicar = (nino: Nino) => {
    actualizar(nino.id, { estado: "publicado" });
    toast.success("Informe publicado", {
      description: `${nino.nombre}: el apoderado recibirá una notificación.`,
    });
  };

  const despublicar = (nino: Nino) => {
    actualizar(nino.id, { estado: "borrador" });
    toast.info("Informe despublicado", {
      description: `Vuelve a borrador para corrección.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Informes diarios
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Registra el día de cada párvulo: alimentación, siesta, ánimo y
            observaciones.
          </p>
        </div>

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
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <EstadoCard
          label="Pendientes"
          value={resumen.pendiente}
          hint="Sin completar"
          color="amber"
          icon={RiTimeLine}
        />
        <EstadoCard
          label="Borradores"
          value={resumen.borrador}
          hint="En proceso de redacción"
          color="sky"
          icon={RiDraftLine}
        />
        <EstadoCard
          label="Publicados"
          value={resumen.publicado}
          hint="Visibles para apoderados"
          color="emerald"
          icon={RiCheckDoubleFill}
        />
      </div>

      {/* Tabs sala */}
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

      {/* Accordion de informes */}
      {ninosPresentes.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground flex flex-col items-center gap-2 p-12 text-center">
            <RiRestaurantLine className="size-10 opacity-40" />
            <p className="text-sm">No hay párvulos presentes en esta sala.</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion
          type="multiple"
          className="flex border-none overflow-visible flex-col gap-3"
        >
          {ninosPresentes.map((nino) => {
            const informe = getInforme(nino.id);
            const cfg = estadoConfig[informe.estado];

            return (
              <AccordionItem
                key={nino.id}
                value={String(nino.id)}
                className="bg-card rounded-xl border px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center gap-3 pr-3">
                    <Avatar className="size-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {inicialesDe(nino.nombre, nino.apellido)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {nino.nombre} {nino.apellido}
                        </p>
                        {informe.animo && (
                          <span
                            className="text-base"
                            aria-label={`Ánimo: ${informe.animo}`}
                          >
                            {animoEmoji[informe.animo]}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground truncate text-xs">
                        {nino.sala}
                        {informe.siestaInicio && informe.siestaFin && (
                          <>
                            {" · "}
                            <RiMoonLine className="inline size-3" />{" "}
                            {informe.siestaInicio}–{informe.siestaFin}
                          </>
                        )}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn("shrink-0", cfg.className)}
                    >
                      {cfg.label}
                    </Badge>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pt-2 pb-4">
                  <InformeForm
                    informe={informe}
                    onChange={(patch) => actualizar(nino.id, patch)}
                    onGuardarBorrador={() => guardarBorrador(nino)}
                    onPublicar={() => publicar(nino)}
                    onDespublicar={() => despublicar(nino)}
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

/* ---------- Form de informe ---------- */

function InformeForm({
  informe,
  onChange,
  onGuardarBorrador,
  onPublicar,
  onDespublicar,
}: {
  informe: Informe;
  onChange: (patch: Partial<Informe>) => void;
  onGuardarBorrador: () => void;
  onPublicar: () => void;
  onDespublicar: () => void;
}) {
  const publicado = informe.estado === "publicado";
  const uid = useId();

  return (
    <div className="space-y-5 border-t pt-4">
      {/* Alimentación */}
      <section>
        <div className="mb-2 flex items-center gap-2">
          <RiRestaurantLine className="text-muted-foreground size-4" />
          <Label className="text-sm font-semibold">Alimentación</Label>
        </div>
        <div className="flex flex-wrap gap-4">
          {(["desayuno", "almuerzo", "once"] as const).map((comida) => (
            <label
              key={comida}
              className="flex cursor-pointer items-center gap-2 text-sm capitalize"
            >
              <Checkbox
                checked={informe.alimentacion[comida]}
                onCheckedChange={(v) =>
                  onChange({
                    alimentacion: {
                      ...informe.alimentacion,
                      [comida]: Boolean(v),
                    },
                  })
                }
                disabled={publicado}
              />
              {comida}
            </label>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between gap-5">
        {/* Siesta */}
        <section className="w-1/2">
          <div className="mb-2 flex items-center gap-2">
            <RiMoonLine className="text-muted-foreground size-4" />
            <Label className="text-sm font-semibold">Siesta</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`${uid}-siesta-inicio`} className="text-xs">
                Inicio
              </Label>
              <Input
                id={`${uid}-siesta-inicio`}
                type="time"
                value={informe.siestaInicio}
                onChange={(e) => onChange({ siestaInicio: e.target.value })}
                disabled={publicado}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${uid}-siesta-fin`} className="text-xs">
                Fin
              </Label>
              <Input
                id={`${uid}-siesta-fin`}
                type="time"
                value={informe.siestaFin}
                onChange={(e) => onChange({ siestaFin: e.target.value })}
                disabled={publicado}
              />
            </div>
          </div>
        </section>

        {/* Mudas */}
        <section>
          <Label className="mb-2 mt-4 block text-sm font-semibold">
            Mudas / baño
          </Label>
          <Input
            type="number"
            min={0}
            max={10}
            value={informe.mudas}
            onChange={(e) => onChange({ mudas: Number(e.target.value) || 0 })}
            disabled={publicado}
            className="w-[150px]"
          />
        </section>
      </div>

      {/* Estado de ánimo */}
      <section>
        <Label className="mb-2 block text-sm font-semibold">
          Estado de ánimo
        </Label>
        <div className="flex gap-2">
          <AnimoButton
            animo="feliz"
            actual={informe.animo}
            onClick={(v) => onChange({ animo: v })}
            disabled={publicado}
            Icon={RiEmotionHappyLine}
            IconFill={RiEmotionHappyFill}
            label="Contento"
            color="emerald"
          />
          <AnimoButton
            animo="normal"
            actual={informe.animo}
            onClick={(v) => onChange({ animo: v })}
            disabled={publicado}
            Icon={RiEmotionNormalLine}
            IconFill={RiEmotionNormalFill}
            label="Normal"
            color="amber"
          />
          <AnimoButton
            animo="triste"
            actual={informe.animo}
            onClick={(v) => onChange({ animo: v })}
            disabled={publicado}
            Icon={RiEmotionSadLine}
            IconFill={RiEmotionSadFill}
            label="Triste"
            color="rose"
          />
        </div>
      </section>

      {/* Actividades */}
      <section>
        <Label
          htmlFor={`${uid}-actividades`}
          className="mb-2 block text-sm font-semibold"
        >
          Actividades realizadas
        </Label>
        <Textarea
          id={`${uid}-actividades`}
          value={informe.actividades}
          onChange={(e) => onChange({ actividades: e.target.value })}
          placeholder="Describe brevemente las actividades del día…"
          rows={3}
          disabled={publicado}
        />
      </section>

      {/* Observaciones */}
      <section>
        <Label
          htmlFor={`${uid}-observaciones`}
          className="mb-2 block text-sm font-semibold"
        >
          Observaciones
        </Label>
        <Textarea
          id={`${uid}-observaciones`}
          value={informe.observaciones}
          onChange={(e) => onChange({ observaciones: e.target.value })}
          placeholder="Comentarios adicionales para el apoderado…"
          rows={3}
          disabled={publicado}
        />
      </section>

      {/* Foto */}
      <section>
        <Label className="mb-2 block text-sm font-semibold">Foto del día</Label>
        {informe.fotoCargada ? (
          <div className="bg-muted flex items-center gap-3 rounded-lg border p-3">
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
              <RiImageAddLine className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">foto-del-dia.jpg</p>
              <p className="text-muted-foreground text-xs">
                Adjuntada correctamente
              </p>
            </div>
            {!publicado && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ fotoCargada: false })}
              >
                Quitar
              </Button>
            )}
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full flex-col gap-1 border-dashed py-6"
            disabled={publicado}
            onClick={() => {
              onChange({ fotoCargada: true });
              toast.success("Foto adjuntada (simulado)");
            }}
          >
            <RiImageAddLine className="size-6" />
            <span className="text-sm">Adjuntar foto</span>
            <span className="text-muted-foreground text-xs">
              JPG o PNG hasta 5 MB
            </span>
          </Button>
        )}
      </section>

      {/* Acciones */}
      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        {publicado ? (
          <Button variant="outline" onClick={onDespublicar} className="gap-1.5">
            <RiDraftLine className="size-4" />
            Despublicar para corrección
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={onGuardarBorrador}
              className="gap-1.5"
            >
              <RiDraftLine className="size-4" />
              Guardar borrador
            </Button>
            <Button onClick={onPublicar} className="gap-1.5">
              <RiSendPlaneFill className="size-4" />
              Publicar informe
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Botón de ánimo ---------- */

function AnimoButton({
  animo,
  actual,
  onClick,
  disabled,
  Icon,
  IconFill,
  label,
  color,
}: {
  animo: Exclude<Animo, "">;
  actual: Animo;
  onClick: (v: Animo) => void;
  disabled: boolean;
  Icon: React.ComponentType<{ className?: string }>;
  IconFill: React.ComponentType<{ className?: string }>;
  label: string;
  color: "emerald" | "amber" | "rose";
}) {
  const activo = actual === animo;
  const colorStyles: Record<typeof color, string> = {
    emerald:
      "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    amber:
      "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    rose: "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
  };

  return (
    <button
      type="button"
      onClick={() => onClick(activo ? "" : animo)}
      disabled={disabled}
      className={cn(
        "hover:bg-muted/50 flex flex-1 flex-col items-center gap-1 rounded-lg border-2 px-3 py-3 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        activo ? colorStyles[color] : "border-border",
      )}
      aria-pressed={activo}
    >
      {activo ? <IconFill className="size-6" /> : <Icon className="size-6" />}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

/* ---------- Stat card local ---------- */

function EstadoCard({
  label,
  value,
  hint,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint: string;
  color: "amber" | "sky" | "emerald";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const styles: Record<typeof color, string> = {
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  };

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
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
            styles[color],
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
