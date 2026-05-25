import type { TipoEvento } from "@/lib/db/types";

// Config de estilos por tipo de evento. Independiente de la fuente de datos —
// los componentes consumen esto para renderizar consistente.
export const tipoEventoConfig: Record<
  TipoEvento,
  {
    label: string;
    dot: string;
    bg: string;
    text: string;
    border: string;
    emoji: string;
  }
> = {
  reunion: {
    label: "Reunión",
    dot: "bg-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-900",
    emoji: "🔵",
  },
  actividad: {
    label: "Actividad educativa",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-900",
    emoji: "🟢",
  },
  celebracion: {
    label: "Celebración",
    dot: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-900",
    emoji: "🟡",
  },
  feriado: {
    label: "Feriado",
    dot: "bg-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-900",
    emoji: "🔴",
  },
};
