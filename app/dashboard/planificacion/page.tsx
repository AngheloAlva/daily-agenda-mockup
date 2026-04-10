import Link from "next/link";
import {
  RiArrowLeftLine,
  RiBookOpenLine,
  RiCheckLine,
  RiToolsLine,
} from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const caracteristicas = [
  "Vista semanal con bloques de actividades por sala",
  "Referencia a las Bases Curriculares de Educación Parvularia",
  "Campos por experiencia: ámbito, núcleo y objetivo de aprendizaje",
  "Asignación de recursos y materiales necesarios",
  "Asociación de cada planificación a nivel / sala específica",
  "Duplicar planificaciones anteriores como plantilla",
];

export default function PlanificacionPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mb-3 flex justify-center">
            <div className="bg-primary/10 text-primary relative flex size-16 items-center justify-center rounded-2xl">
              <RiBookOpenLine className="size-8" />
              <span className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-amber-400 text-white shadow">
                <RiToolsLine className="size-4" />
              </span>
            </div>
          </div>

          <Badge variant="outline" className="mx-auto w-fit gap-1">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Próximamente
          </Badge>

          <CardTitle className="font-heading text-2xl md:text-3xl">
            Planificación curricular
          </CardTitle>
          <CardDescription className="mx-auto max-w-md text-sm">
            Estamos trabajando en el módulo de planificación pedagógica
            alineado con las Bases Curriculares de Educación Parvularia.
            Estará disponible en una próxima actualización.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
              Qué incluirá este módulo
            </p>
            <ul className="space-y-2">
              {caracteristicas.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm">
                  <div className="bg-primary/10 text-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                    <RiCheckLine className="size-3" />
                  </div>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-primary/20 bg-primary/5 rounded-lg border p-4">
            <p className="text-sm">
              <span className="font-semibold">Mientras tanto,</span> puedes
              usar el módulo de{" "}
              <Link
                href="/dashboard/informes"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Informes diarios
              </Link>{" "}
              para registrar las actividades realizadas con los párvulos, o el{" "}
              <Link
                href="/dashboard/calendario"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Calendario
              </Link>{" "}
              para programar actividades puntuales.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <Button asChild variant="outline" className="gap-1.5">
              <Link href="/dashboard">
                <RiArrowLeftLine className="size-4" />
                Volver al inicio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
