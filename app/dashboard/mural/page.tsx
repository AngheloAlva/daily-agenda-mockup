"use client";

import { useId, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  RiAttachment2,
  RiChat3Line,
  RiDownloadLine,
  RiEdit2Line,
  RiFilePdfLine,
  RiHeartLine,
  RiImageLine,
  RiMoreLine,
  RiPushpinFill,
  RiSendPlaneFill,
  RiShareLine,
  RiStarFill,
} from "@remixicon/react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  documentosInstitucionales,
  publicaciones as publicacionesBase,
  usuarioDemo,
  type Adjunto,
  type Publicacion,
} from "@/lib/data/mock";

export default function MuralPage() {
  const [publicaciones, setPublicaciones] =
    useState<Publicacion[]>(publicacionesBase);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [liked, setLiked] = useState<Record<number, boolean>>({});

  const esDireccion = usuarioDemo.rol === "directora";

  const toggleLike = (id: number) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
    setPublicaciones((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, likes: p.likes + (liked[id] ? -1 : 1) } : p,
      ),
    );
  };

  const crearPublicacion = (titulo: string, contenido: string) => {
    const nueva: Publicacion = {
      id: Date.now(),
      autorNombre: usuarioDemo.nombre,
      autorRol: usuarioDemo.cargo,
      autorIniciales: usuarioDemo.iniciales,
      titulo,
      contenido,
      fecha: new Date().toISOString(),
      likes: 0,
      comentarios: 0,
    };
    setPublicaciones((prev) => [nueva, ...prev]);
    toast.success("Publicación creada", { description: titulo });
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Encabezado */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              Mural
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Comunicaciones, novedades y documentos institucionales del centro.
            </p>
          </div>
          {esDireccion && (
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <RiEdit2Line className="size-4" />
              Nueva publicación
            </Button>
          )}
        </div>

        {/* Documentos institucionales fijados */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <RiPushpinFill className="text-primary size-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Documentos institucionales
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documentosInstitucionales.map((doc) => (
              <Card
                key={doc.id}
                className="hover:border-primary/40 hover:shadow-md transition-all"
              >
                <CardContent className="flex items-start gap-3">
                  <div className="bg-rose-100 text-rose-700 flex size-11 shrink-0 items-center justify-center rounded-xl dark:bg-rose-950/40 dark:text-rose-400">
                    <RiFilePdfLine className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">
                      {doc.titulo}
                    </h3>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                      {doc.descripcion}
                    </p>
                    <div className="text-muted-foreground mt-2 flex items-center gap-2 text-[11px]">
                      <span>{doc.tamano}</span>
                      <span>·</span>
                      <span>
                        Actualizado{" "}
                        {format(
                          new Date(doc.fechaActualizacion),
                          "d MMM yyyy",
                          {
                            locale: es,
                          },
                        )}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() =>
                      toast.info(`Descargando ${doc.titulo}`, {
                        description: `${doc.tamano}`,
                      })
                    }
                    aria-label={`Descargar ${doc.titulo}`}
                  >
                    <RiDownloadLine className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Feed de publicaciones */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Publicaciones recientes
            </h2>
            <span className="text-muted-foreground text-xs">
              {publicaciones.length} publicaciones
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {publicaciones.map((pub) => (
              <PublicacionCard
                key={pub.id}
                publicacion={pub}
                liked={Boolean(liked[pub.id])}
                onLike={() => toggleLike(pub.id)}
              />
            ))}
          </div>
        </section>
      </div>

      <NuevaPublicacionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCrear={crearPublicacion}
      />
    </>
  );
}

/* ---------- Card de publicación ---------- */

function PublicacionCard({
  publicacion,
  liked,
  onLike,
}: {
  publicacion: Publicacion;
  liked: boolean;
  onLike: () => void;
}) {
  const fecha = new Date(publicacion.fecha);

  return (
    <Card
      className={cn(
        "overflow-hidden ",
        publicacion.destacado && "ring-primary/20 pt-0 ring-2",
      )}
    >
      {publicacion.destacado && (
        <div className="from-primary/10 to-primary/5 flex items-center gap-2 border-b bg-linear-to-r px-4 py-2">
          <RiStarFill className="text-amber-500 size-4" />
          <span className="text-primary text-xs font-semibold uppercase tracking-wide">
            Publicación destacada
          </span>
        </div>
      )}

      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <Avatar className="size-11 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {publicacion.autorIniciales}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{publicacion.autorNombre}</p>
          <p className="text-muted-foreground text-xs">
            {publicacion.autorRol}
          </p>
          <p
            className="text-muted-foreground text-[11px]"
            title={format(fecha, "d 'de' MMMM, yyyy 'a las' HH:mm", {
              locale: es,
            })}
          >
            {formatDistanceToNow(fecha, { locale: es, addSuffix: true })}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Más opciones"
        >
          <RiMoreLine className="size-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <CardTitle className="font-heading mb-2 text-lg">
            {publicacion.titulo}
          </CardTitle>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {publicacion.contenido}
          </p>
        </div>

        {publicacion.adjuntos && publicacion.adjuntos.length > 0 && (
          <div className="space-y-2">
            {publicacion.adjuntos.map((adj) => (
              <AdjuntoItem key={adj.nombre} adjunto={adj} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-1.5", liked && "text-rose-500")}
            onClick={onLike}
          >
            <RiHeartLine className={cn("size-4", liked && "fill-current")} />
            {publicacion.likes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              toast.info("Comentarios", {
                description: "Próximamente en la versión completa.",
              })
            }
          >
            <RiChat3Line className="size-4" />
            {publicacion.comentarios}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={() => toast.success("Enlace copiado al portapapeles")}
          >
            <RiShareLine className="size-4" />
            <span className="hidden sm:inline">Compartir</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Item de adjunto ---------- */

function AdjuntoItem({ adjunto }: { adjunto: Adjunto }) {
  const Icon = adjunto.tipo === "imagen" ? RiImageLine : RiFilePdfLine;
  const colorClass =
    adjunto.tipo === "imagen"
      ? "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400"
      : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400";

  return (
    <div className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-2.5 transition-colors">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          colorClass,
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{adjunto.nombre}</p>
        <p className="text-muted-foreground text-xs">{adjunto.tamano}</p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => toast.info(`Descargando ${adjunto.nombre}`)}
        aria-label={`Descargar ${adjunto.nombre}`}
      >
        <RiDownloadLine className="size-4" />
      </Button>
    </div>
  );
}

/* ---------- Dialog nueva publicación ---------- */

function NuevaPublicacionDialog({
  open,
  onOpenChange,
  onCrear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCrear: (titulo: string, contenido: string) => void;
}) {
  const uid = useId();
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");

  const reset = () => {
    setTitulo("");
    setContenido("");
  };

  const contadorContenido = useMemo(() => contenido.length, [contenido]);

  const publicar = () => {
    if (!titulo.trim() || !contenido.trim()) {
      toast.error("Completa el título y el contenido");
      return;
    }
    onCrear(titulo, contenido);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading">Nueva publicación</DialogTitle>
          <DialogDescription>
            Comunica novedades, actividades o información relevante a toda la
            comunidad educativa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/40 flex items-center gap-3 rounded-lg p-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {usuarioDemo.iniciales}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{usuarioDemo.nombre}</p>
              <p className="text-muted-foreground text-xs">
                Publicando como {usuarioDemo.cargo}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${uid}-titulo`}>Título</Label>
            <Input
              id={`${uid}-titulo`}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Recordatorio jornada de vacunación"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${uid}-contenido`}>Contenido</Label>
              <span className="text-muted-foreground text-xs">
                {contadorContenido}/1000
              </span>
            </div>
            <Textarea
              id={`${uid}-contenido`}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Escribe el mensaje que verá toda la comunidad…"
              rows={6}
              maxLength={1000}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                toast.info("Adjuntar archivo", {
                  description: "Disponible en la versión final.",
                })
              }
            >
              <RiAttachment2 className="size-4" />
              Adjuntar archivo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                toast.info("Adjuntar imagen", {
                  description: "Disponible en la versión final.",
                })
              }
            >
              <RiImageLine className="size-4" />
              Agregar imagen
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button onClick={publicar} className="gap-1.5">
            <RiSendPlaneFill className="size-4" />
            Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
