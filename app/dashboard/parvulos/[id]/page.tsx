"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  RiArrowLeftLine,
  RiBriefcaseLine,
  RiCake2Fill,
  RiDownloadLine,
  RiFileExcel2Line,
  RiFilePdfLine,
  RiGroupLine,
  RiHeartPulseLine,
  RiMapPin2Line,
  RiParentLine,
  RiPhoneLine,
  RiShieldCheckLine,
  RiUserSmileLine,
} from "@remixicon/react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { calcularEdad, diasHastaCumple, inicialesDe } from "@/lib/utils/nino";
import { useState } from "react";
import { useDbContext } from "@/lib/db/provider";
import { useDbQuery } from "@/lib/db/use-db-query";
import { useSesion } from "@/lib/db/sesion-context";
import { getFichaCompleta } from "@/lib/db/repositories/ninos";
import { generarFichaParvulo } from "@/lib/reports";
import type { Persona } from "@/lib/db/types";

export default function ParvuloDetallePage() {
  const params = useParams<{ id: string }>();
  const ninoId = Number(params.id);
  const dbCtx = useDbContext();
  const { centroActivo, usuario, nowDemo } = useSesion();
  const [exportandoPdf, setExportandoPdf] = useState(false);

  const fichaQuery = useDbQuery(
    (db) =>
      Number.isFinite(ninoId)
        ? getFichaCompleta(db, ninoId)
        : Promise.resolve(null),
    [ninoId],
  );

  if (fichaQuery.loading) return <DetalleSkeleton />;

  if (!fichaQuery.loading && !fichaQuery.data) {
    notFound();
  }

  const data = fichaQuery.data!;
  const { nino, ficha, autorizadosRetiro, contactosEmergencia, entrevistas, documentos } = data;
  const edad = calcularEdad(nino.fechaNacimiento, nowDemo);
  const dias = diasHastaCumple(nino.fechaNacimiento, nowDemo);
  const fechaNac = new Date(nino.fechaNacimiento);

  const exportarPdf = async () => {
    if (dbCtx.status !== "ready") return;
    setExportandoPdf(true);
    try {
      const nombre = await generarFichaParvulo(
        { db: dbCtx.db, centro: centroActivo, usuario },
        nino.id,
      );
      toast.success("Ficha exportada", { description: nombre });
    } catch (e) {
      toast.error("No se pudo generar el PDF", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setExportandoPdf(false);
    }
  };

  const exportarExcel = () =>
    toast.info("Exportar a Excel", {
      description: "Disponible en la versión final.",
    });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
          <Link href="/dashboard/parvulos">
            <RiArrowLeftLine className="size-4" />
            Volver al listado
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
          <div className="relative shrink-0">
            <Avatar className="ring-background size-24 ring-4 md:size-28">
              <AvatarFallback className="bg-primary/10 text-primary font-heading text-3xl font-semibold">
                {inicialesDe(nino.nombre, nino.apellido)}
              </AvatarFallback>
            </Avatar>
            {dias <= 14 && (
              <span className="absolute -top-1 -right-1 flex size-8 items-center justify-center rounded-full bg-amber-400 text-white shadow">
                <RiCake2Fill className="size-4" />
              </span>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
                {nino.nombre} {nino.apellido}
              </h1>
              <p className="text-muted-foreground text-sm">
                {edad.texto} · Nacido/a el{" "}
                {format(fechaNac, "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">
                <RiUserSmileLine className="size-3" />
                {nino.salaNombre}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "gap-1",
                  nino.estadoCuenta === "activo"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    nino.estadoCuenta === "activo"
                      ? "bg-emerald-500"
                      : "bg-amber-500",
                  )}
                />
                Cuenta apoderado:{" "}
                {nino.estadoCuenta === "activo" ? "Activa" : "Pendiente"}
              </Badge>
              {dias === 0 ? (
                <Badge className="gap-1 bg-amber-400 text-white hover:bg-amber-400">
                  <RiCake2Fill className="size-3" />
                  ¡Cumple hoy!
                </Badge>
              ) : dias <= 14 ? (
                <Badge variant="outline" className="gap-1">
                  <RiCake2Fill className="size-3 text-amber-500" />
                  Cumple en {dias} días
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:flex-col">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void exportarPdf()}
              disabled={exportandoPdf}
            >
              <RiFilePdfLine className="size-4" />
              {exportandoPdf ? "Generando…" : "Exportar PDF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={exportarExcel}
            >
              <RiFileExcel2Line className="size-4" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personales">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="w-max justify-start">
            <TabsTrigger value="personales" className="gap-1.5">
              <RiUserSmileLine className="size-4" />
              Datos personales
            </TabsTrigger>
            <TabsTrigger value="salud" className="gap-1.5">
              <RiHeartPulseLine className="size-4" />
              Salud
            </TabsTrigger>
            <TabsTrigger value="familia" className="gap-1.5">
              <RiParentLine className="size-4" />
              Familia
            </TabsTrigger>
            <TabsTrigger value="educacion" className="gap-1.5">
              <RiGroupLine className="size-4" />
              Educación
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-1.5">
              <RiFilePdfLine className="size-4" />
              Documentos
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>

        <TabsContent value="personales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Datos personales</CardTitle>
              <CardDescription>Información básica del párvulo</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Dato label="Nombre completo" valor={`${nino.nombre} ${nino.apellido}`} />
              <Dato label="RUT" valor={nino.rut ?? "—"} />
              <Dato
                label="Fecha de nacimiento"
                valor={format(fechaNac, "d 'de' MMMM 'de' yyyy", { locale: es })}
              />
              <Dato label="Edad" valor={edad.texto} />
              <Dato label="Nacionalidad" valor={nino.nacionalidad ?? "—"} />
              <Dato label="Grupo sanguíneo" valor={nino.grupoSanguineo ?? "—"} />
              <Dato
                label="Dirección"
                valor={
                  nino.direccion
                    ? `${nino.direccion}${nino.comuna ? `, ${nino.comuna}` : ""}`
                    : "Sin dirección registrada"
                }
                icon={RiMapPin2Line}
                full
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salud" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Salud</CardTitle>
              <CardDescription>
                Previsión, alergias y condiciones médicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Dato
                  label="Previsión de salud"
                  valor={ficha.prevision ?? "—"}
                  icon={RiShieldCheckLine}
                />
                <Dato
                  label="Seguro escolar"
                  valor={ficha.seguroEscolar ? "Vigente" : "No registrado"}
                />
              </div>

              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                  Alergias
                </p>
                {ficha.alergias.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Sin alergias registradas
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ficha.alergias.map((a) => (
                      <Badge
                        key={a}
                        variant="outline"
                        className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400"
                      >
                        {a}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                  Enfermedades / condiciones
                </p>
                {ficha.enfermedades.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Sin condiciones registradas
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ficha.enfermedades.map((e) => (
                      <Badge
                        key={e}
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400"
                      >
                        {e}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {ficha.dietaEspecial && (
                <div className="bg-amber-50 border-amber-200 rounded-lg border p-3 dark:border-amber-900 dark:bg-amber-950/30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    Dieta especial
                  </p>
                  <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">
                    {ficha.dietaEspecial}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="familia" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">
                  Composición familiar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dato label="Vive con" valor={ficha.viveCon ?? "—"} />
                <Dato
                  label="Ocupación madre"
                  valor={ficha.ocupacionMadre ?? "—"}
                  icon={RiBriefcaseLine}
                />
                <Dato
                  label="Ocupación padre"
                  valor={ficha.ocupacionPadre ?? "—"}
                  icon={RiBriefcaseLine}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">
                  Personas autorizadas para retiro
                </CardTitle>
                <CardDescription>
                  Solo estas personas pueden retirar al párvulo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {autorizadosRetiro.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Sin personas autorizadas registradas
                  </p>
                ) : (
                  autorizadosRetiro.map((p, i) => (
                    <PersonaItem key={`${p.nombre}-${i}`} persona={p} />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="font-heading text-base">
                  Contactos de emergencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contactosEmergencia.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Sin contactos de emergencia registrados
                  </p>
                ) : (
                  contactosEmergencia.map((p, i) => (
                    <PersonaItem key={`${p.nombre}-${i}`} persona={p} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="educacion" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">
                Información educativa
              </CardTitle>
              <CardDescription>
                Proceso de adaptación, observaciones y convivencia escolar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                  Periodo de adaptación
                </p>
                <p className="text-sm">{ficha.periodoAdaptacion ?? "Sin registro"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                  Observaciones generales
                </p>
                <p className="text-sm leading-relaxed">
                  {ficha.observaciones ?? "Sin observaciones"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                  Convivencia escolar
                </p>
                <p className="text-sm leading-relaxed">
                  {ficha.convivencia ?? "Sin registro"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">
                  Archivos adjuntos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {documentos.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Sin documentos adjuntos
                  </p>
                ) : (
                  documentos.map((doc) => (
                    <div
                      key={doc.id}
                      className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                    >
                      <div className="bg-rose-100 text-rose-700 flex size-9 items-center justify-center rounded-lg dark:bg-rose-950/40 dark:text-rose-400">
                        <RiFilePdfLine className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{doc.nombre}</p>
                        <p className="text-muted-foreground text-xs">
                          {format(new Date(doc.fecha), "d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toast.info(`Descargando ${doc.nombre}`)}
                        aria-label={`Descargar ${doc.nombre}`}
                      >
                        <RiDownloadLine className="size-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">
                  Entrevistas con apoderados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {entrevistas.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Sin entrevistas registradas
                  </p>
                ) : (
                  entrevistas.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <div
                        className={cn(
                          "mt-0.5 size-2 shrink-0 rounded-full",
                          e.realizada ? "bg-emerald-500" : "bg-muted-foreground/40",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{e.titulo}</p>
                        <p className="text-muted-foreground text-xs">
                          {format(new Date(e.fecha), "d 'de' MMMM, yyyy", {
                            locale: es,
                          })}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          e.realizada
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "border-muted-foreground/20 text-muted-foreground",
                        )}
                      >
                        {e.realizada ? "Realizada" : "Programada"}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Dato({
  label,
  valor,
  icon: Icon,
  full = false,
}: {
  label: string;
  valor: string;
  icon?: React.ComponentType<{ className?: string }>;
  full?: boolean;
}) {
  return (
    <div className={cn(full && "sm:col-span-2")}>
      <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="text-muted-foreground size-4 shrink-0" />}
        <p className="text-sm">{valor}</p>
      </div>
    </div>
  );
}

function PersonaItem({ persona }: { persona: Persona }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Avatar className="size-10 shrink-0">
        <AvatarFallback className="bg-muted text-xs font-semibold">
          {persona.nombre
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{persona.nombre}</p>
        <p className="text-muted-foreground text-xs">{persona.parentesco}</p>
      </div>
      <div className="text-muted-foreground flex items-center gap-1 text-xs">
        <RiPhoneLine className="size-3" />
        <span className="hidden sm:inline">{persona.telefono}</span>
      </div>
    </div>
  );
}

function DetalleSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-32" />
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
          <Skeleton className="size-24 rounded-full md:size-28" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
