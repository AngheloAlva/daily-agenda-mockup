import type {
  AmbitoAprendizaje,
  EstadoPlanificacion,
} from "@/lib/db/types";

// Ámbitos según Bases Curriculares de Educación Parvularia (Chile, 2018).
export const ambitoConfig: Record<
  AmbitoAprendizaje,
  { label: string; descripcion: string; dot: string; bg: string; text: string }
> = {
  desarrollo_personal_social: {
    label: "Desarrollo personal y social",
    descripcion: "Identidad, autonomía, convivencia y ciudadanía",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  comunicacion_integral: {
    label: "Comunicación integral",
    descripcion: "Lenguaje verbal y artístico",
    dot: "bg-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-400",
  },
  interaccion_comprension_entorno: {
    label: "Interacción y comprensión del entorno",
    descripcion: "Exploración del entorno natural, cultural y matemático",
    dot: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
  },
};

export const estadoPlanificacionConfig: Record<
  EstadoPlanificacion,
  { label: string; className: string }
> = {
  borrador: {
    label: "Borrador",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-400",
  },
  aprobada: {
    label: "Aprobada",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  archivada: {
    label: "Archivada",
    className: "border-muted-foreground/20 text-muted-foreground",
  },
};
