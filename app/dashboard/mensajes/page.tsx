"use client";

import { useEffect, useMemo, useState } from "react";
import { format, formatDistance, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import {
  RiArrowLeftLine,
  RiAttachment2,
  RiCheckDoubleLine,
  RiCheckLine,
  RiEdit2Line,
  RiInboxLine,
  RiPushpinFill,
  RiSearchLine,
  RiSendPlaneFill,
  RiTimeLine,
} from "@remixicon/react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useDbQuery } from "@/lib/db/use-db-query";
import { useDbMutation } from "@/lib/db/use-db-mutation";
import { useSesion } from "@/lib/db/sesion-context";
import {
  contarNoLeidas,
  crearConversacionIndividual,
  enviarMensaje,
  getConversacion,
  listConversaciones,
  marcarLeida,
  responderInteractivo,
} from "@/lib/db/repositories/mensajes";
import { crear as crearBorrador, listByAutor as listBorradores } from "@/lib/db/repositories/borradores";
import { listApoderadosByCentro } from "@/lib/db/repositories/usuarios";
import type {
  ApoderadoLite,
  ConversacionResumen,
  MensajeDB,
} from "@/lib/db/types";

type Vista = "recibidos" | "borradores";

const formatoFecha = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ayer";
  return format(d, "d MMM", { locale: es });
};

export default function MensajesPage() {
  const { usuario, centroActivo, nowDemo } = useSesion();
  const usuarioId = usuario.id;
  const centroId = centroActivo.id;

  const conversacionesQuery = useDbQuery(
    async (db) => (usuarioId == null ? [] : await listConversaciones(db, usuarioId)),
    [usuarioId],
  );
  const noLeidasQuery = useDbQuery(
    async (db) => (usuarioId == null ? 0 : await contarNoLeidas(db, usuarioId)),
    [usuarioId],
  );
  const borradoresQuery = useDbQuery(
    async (db) => (usuarioId == null ? [] : await listBorradores(db, usuarioId)),
    [usuarioId],
  );
  const apoderadosQuery = useDbQuery(
    async (db) => (centroId == null ? [] : await listApoderadosByCentro(db, centroId)),
    [centroId],
  );

  const [vista, setVista] = useState<Vista>("recibidos");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [mostrarPanelConversacion, setMostrarPanelConversacion] = useState(false);

  const conversaciones = conversacionesQuery.data ?? [];
  const borradores = borradoresQuery.data ?? [];
  const apoderados = apoderadosQuery.data ?? [];

  // Auto-seleccionar la primera conversación una vez cargadas
  useEffect(() => {
    if (seleccionadaId == null && conversaciones.length > 0) {
      setSeleccionadaId(conversaciones[0].id);
    }
  }, [conversaciones, seleccionadaId]);

  const conversacionQuery = useDbQuery(
    async (db) =>
      seleccionadaId == null || usuarioId == null
        ? null
        : await getConversacion(db, seleccionadaId, usuarioId),
    [seleccionadaId, usuarioId],
  );

  const marcarLeidaMut = useDbMutation((db, convId: number, uid: number) =>
    marcarLeida(db, convId, uid),
  );
  const responderMut = useDbMutation((db, mensajeId: number, opcion: string) =>
    responderInteractivo(db, mensajeId, opcion),
  );
  const enviarMut = useDbMutation(
    (db, convId: number, autorId: number, contenido: string) =>
      enviarMensaje(db, convId, autorId, contenido),
  );
  const crearConvMut = useDbMutation(
    (
      db,
      args: {
        autorId: number;
        destinatarioId: number;
        asunto: string;
        contenido: string;
        interactivo?: { botones: string[] } | null;
      },
    ) => crearConversacionIndividual(db, args),
  );
  const crearBorradorMut = useDbMutation(
    (
      db,
      args: {
        centroId: number;
        autorId: number;
        destinatario: string;
        asunto: string;
        contenido: string;
      },
    ) => crearBorrador(db, args),
  );

  // Marcar como leído al seleccionar
  useEffect(() => {
    if (seleccionadaId == null || usuarioId == null) return;
    const conv = conversaciones.find((c) => c.id === seleccionadaId);
    if (!conv || conv.leido) return;

    void marcarLeidaMut.mutate(seleccionadaId, usuarioId).then(() => {
      conversacionesQuery.refetch();
      noLeidasQuery.refetch();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionadaId, usuarioId, conversaciones]);

  const listaFiltrada = useMemo(() => {
    if (!busqueda.trim()) return conversaciones;
    const q = busqueda.toLowerCase();
    return conversaciones.filter(
      (c) =>
        c.asunto.toLowerCase().includes(q) ||
        c.participanteNombre.toLowerCase().includes(q) ||
        (c.preview?.toLowerCase().includes(q) ?? false),
    );
  }, [conversaciones, busqueda]);

  const seleccionar = (id: number) => {
    setSeleccionadaId(id);
    setMostrarPanelConversacion(true);
  };

  const onResponderInteractivo = async (mensajeId: number, opcion: string) => {
    try {
      await responderMut.mutate(mensajeId, opcion);
      conversacionQuery.refetch();
      toast.success("Respuesta enviada", { description: opcion });
    } catch {
      toast.error("No se pudo guardar la respuesta");
    }
  };

  const onEnviarReply = async (contenido: string) => {
    if (seleccionadaId == null || usuarioId == null) return;
    try {
      await enviarMut.mutate(seleccionadaId, usuarioId, contenido);
      conversacionQuery.refetch();
      conversacionesQuery.refetch();
    } catch {
      toast.error("No se pudo enviar el mensaje");
    }
  };

  const onCrearConversacion = async (args: {
    destinatarioId: number;
    asunto: string;
    contenido: string;
    interactivo: { botones: string[] } | null;
  }) => {
    if (usuarioId == null) return;
    const id = await crearConvMut.mutate({
      autorId: usuarioId,
      ...args,
    });
    conversacionesQuery.refetch();
    setSeleccionadaId(id);
    toast.success("Mensaje enviado");
  };

  const onGuardarBorrador = async (args: {
    destinatario: string;
    asunto: string;
    contenido: string;
  }) => {
    if (usuarioId == null || centroId == null) return;
    await crearBorradorMut.mutate({
      centroId,
      autorId: usuarioId,
      ...args,
    });
    borradoresQuery.refetch();
    toast.info("Borrador guardado");
  };

  const noLeidas = noLeidasQuery.data ?? 0;
  const cargandoInbox = conversacionesQuery.loading;

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 md:gap-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:pb-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              Mensajes
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Comunicación con educadoras, apoderados y la comunidad.
            </p>
          </div>
          <Button onClick={() => setNuevoOpen(true)} className="gap-2">
            <RiEdit2Line className="size-4" />
            Nuevo mensaje
          </Button>
        </div>

        <div className="bg-card grid flex-1 overflow-hidden rounded-xl border md:grid-cols-[340px_1fr]">
          <aside
            className={cn(
              "flex min-h-0 flex-col border-r",
              mostrarPanelConversacion && "hidden md:flex",
            )}
          >
            <div className="space-y-3 border-b p-3">
              <Tabs value={vista} onValueChange={(v) => setVista(v as Vista)}>
                <TabsList className="w-full">
                  <TabsTrigger value="recibidos" className="flex-1 gap-1.5">
                    <RiInboxLine className="size-4" />
                    Recibidos
                    {noLeidas > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-primary text-primary-foreground h-5 px-1.5 text-xs"
                      >
                        {noLeidas}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="borradores" className="flex-1 gap-1.5">
                    <RiEdit2Line className="size-4" />
                    Borradores
                    <span className="text-muted-foreground text-xs">
                      ({borradores.length})
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {vista === "recibidos" && (
                <div className="relative">
                  <RiSearchLine className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar conversación…"
                    className="pl-9"
                  />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {vista === "recibidos" ? (
                cargandoInbox ? (
                  <InboxSkeleton />
                ) : listaFiltrada.length === 0 ? (
                  <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 p-8 text-center text-sm">
                    <RiInboxLine className="size-8 opacity-40" />
                    {busqueda ? (
                      <>Sin resultados para &ldquo;{busqueda}&rdquo;</>
                    ) : (
                      <>Sin conversaciones todavía</>
                    )}
                  </div>
                ) : (
                  listaFiltrada.map((c) => (
                    <InboxItem
                      key={c.id}
                      conversacion={c}
                      activa={c.id === seleccionadaId}
                      onClick={() => seleccionar(c.id)}
                    />
                  ))
                )
              ) : borradoresQuery.loading ? (
                <InboxSkeleton />
              ) : borradores.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 p-8 text-center text-sm">
                  <RiEdit2Line className="size-8 opacity-40" />
                  Sin borradores guardados
                </div>
              ) : (
                borradores.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className="hover:bg-muted/50 w-full border-b px-4 py-3 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{b.asunto}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatoFecha(b.fecha)}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Para: {b.destinatario}
                    </p>
                    <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                      {b.preview}
                    </p>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section
            className={cn(
              "flex min-h-0 flex-col",
              !mostrarPanelConversacion && "hidden md:flex",
            )}
          >
            {conversacionQuery.loading ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Cargando conversación…
              </div>
            ) : conversacionQuery.data ? (
              <ConversacionView
                conversacion={conversacionQuery.data}
                usuarioIniciales={`${usuario.nombre[0] ?? ""}${usuario.apellido[0] ?? ""}`.toUpperCase()}
                nowDemo={nowDemo}
                onVolver={() => setMostrarPanelConversacion(false)}
                onResponderInteractivo={onResponderInteractivo}
                onEnviar={onEnviarReply}
                enviando={enviarMut.loading}
              />
            ) : (
              <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <RiInboxLine className="size-10 opacity-40" />
                <div>
                  <p className="text-sm font-medium">Selecciona una conversación</p>
                  <p className="text-xs">
                    Elige un mensaje del inbox para verlo aquí
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <NuevoMensajeDialog
        open={nuevoOpen}
        onOpenChange={setNuevoOpen}
        apoderados={apoderados}
        onEnviar={onCrearConversacion}
        onGuardarBorrador={onGuardarBorrador}
      />
    </>
  );
}

function InboxSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function InboxItem({
  conversacion,
  activa,
  onClick,
}: {
  conversacion: ConversacionResumen;
  activa: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hover:bg-muted/50 relative flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors",
        activa && "bg-primary/5 hover:bg-primary/10",
      )}
    >
      {!conversacion.leido && (
        <span className="bg-primary absolute top-1/2 left-1 size-1.5 -translate-y-1/2 rounded-full" />
      )}

      <Avatar className="size-10 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs font-semibold",
            conversacion.esGrupo
              ? "bg-primary text-primary-foreground"
              : "bg-muted",
          )}
        >
          {conversacion.participanteIniciales}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              !conversacion.leido ? "font-semibold" : "font-medium",
            )}
          >
            {conversacion.participanteNombre}
          </span>
          <span className="text-muted-foreground shrink-0 text-xs">
            {formatoFecha(conversacion.fechaUltimo)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {conversacion.fijado && (
            <RiPushpinFill className="text-primary size-3 shrink-0" />
          )}
          <span
            className={cn(
              "truncate text-xs",
              !conversacion.leido ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            {conversacion.asunto}
          </span>
        </div>
        <p className="text-muted-foreground line-clamp-1 text-xs">
          {conversacion.preview ?? ""}
        </p>
      </div>
    </button>
  );
}

function ConversacionView({
  conversacion,
  usuarioIniciales,
  nowDemo,
  onVolver,
  onResponderInteractivo,
  onEnviar,
  enviando,
}: {
  conversacion: NonNullable<ReturnType<typeof useDbQuery<Awaited<ReturnType<typeof getConversacion>>>>["data"]>;
  usuarioIniciales: string;
  nowDemo: Date;
  onVolver: () => void;
  onResponderInteractivo: (mensajeId: number, opcion: string) => void;
  onEnviar: (contenido: string) => Promise<void> | void;
  enviando: boolean;
}) {
  const [respuesta, setRespuesta] = useState("");

  const enviar = async () => {
    if (!respuesta.trim()) return;
    const texto = respuesta;
    setRespuesta("");
    await onEnviar(texto);
  };

  return (
    <>
      <header className="flex items-center gap-3 border-b p-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onVolver}
          aria-label="Volver"
        >
          <RiArrowLeftLine className="size-5" />
        </Button>
        <Avatar className="size-10">
          <AvatarFallback
            className={cn(
              "text-xs font-semibold",
              conversacion.esGrupo
                ? "bg-primary text-primary-foreground"
                : "bg-muted",
            )}
          >
            {conversacion.participanteIniciales}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold">
              {conversacion.participanteNombre}
            </h2>
            {conversacion.fijado && (
              <Badge variant="outline" className="gap-1 text-xs">
                <RiPushpinFill className="size-3" />
                Fijado
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {conversacion.participanteRol}
          </p>
        </div>
      </header>

      <div className="bg-muted/40 border-b px-4 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Asunto
        </p>
        <p className="text-sm font-medium">{conversacion.asunto}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {conversacion.mensajes.map((m) => (
          <MensajeBurbuja
            key={m.id}
            mensaje={m}
            usuarioIniciales={usuarioIniciales}
            nowDemo={nowDemo}
            onResponder={(opcion) => onResponderInteractivo(m.id, opcion)}
          />
        ))}
      </div>

      <div className="border-t p-3">
        <div className="bg-background focus-within:ring-ring focus-within:ring-1 flex items-end gap-2 rounded-lg border p-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Adjuntar archivo"
            onClick={() =>
              toast.info("Adjuntar archivo", {
                description: "Funcionalidad disponible en la versión final.",
              })
            }
          >
            <RiAttachment2 className="size-5" />
          </Button>
          <Textarea
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            placeholder="Escribe un mensaje…"
            className="min-h-10 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void enviar();
              }
            }}
          />
          <Button
            size="icon"
            className="shrink-0"
            disabled={!respuesta.trim() || enviando}
            onClick={() => void enviar()}
            aria-label="Enviar"
          >
            <RiSendPlaneFill className="size-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

function MensajeBurbuja({
  mensaje,
  usuarioIniciales,
  nowDemo,
  onResponder,
}: {
  mensaje: MensajeDB;
  usuarioIniciales: string;
  nowDemo: Date;
  onResponder: (opcion: string) => void;
}) {
  const fecha = new Date(mensaje.fecha);

  return (
    <div className={cn("flex gap-2", mensaje.esMio && "flex-row-reverse")}>
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="bg-muted text-[10px] font-semibold">
          {mensaje.esMio ? usuarioIniciales : mensaje.autorIniciales}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex max-w-[80%] flex-col gap-1", mensaje.esMio && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            mensaje.esMio
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md",
          )}
        >
          {mensaje.contenido}
        </div>

        {mensaje.tipo === "interactivo" && mensaje.botones && (
          <div className="mt-1 flex flex-wrap gap-2">
            {mensaje.botones.map((b) => {
              const seleccionado = mensaje.respuesta === b;
              const haySeleccion = Boolean(mensaje.respuesta);
              return (
                <Button
                  key={b}
                  size="sm"
                  variant={seleccionado ? "default" : "outline"}
                  disabled={haySeleccion}
                  onClick={() => onResponder(b)}
                  className="h-8 text-xs"
                >
                  {seleccionado && <RiCheckLine className="size-3" />}
                  {b}
                </Button>
              );
            })}
          </div>
        )}

        <div className="text-muted-foreground flex items-center gap-1.5 px-1 text-[10px]">
          <span>{format(fecha, "HH:mm")}</span>
          <span>·</span>
          <span title={formatDistance(fecha, nowDemo, { locale: es, addSuffix: true })}>
            {formatDistance(fecha, nowDemo, { locale: es, addSuffix: true })}
          </span>
          {mensaje.esMio &&
            (mensaje.estado === "leido" ? (
              <RiCheckDoubleLine className="text-primary size-3" />
            ) : mensaje.estado === "entregado" ? (
              <RiCheckDoubleLine className="size-3" />
            ) : (
              <RiCheckLine className="size-3" />
            ))}
        </div>
      </div>
    </div>
  );
}

function NuevoMensajeDialog({
  open,
  onOpenChange,
  apoderados,
  onEnviar,
  onGuardarBorrador,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apoderados: ApoderadoLite[];
  onEnviar: (args: {
    destinatarioId: number;
    asunto: string;
    contenido: string;
    interactivo: { botones: string[] } | null;
  }) => Promise<void> | void;
  onGuardarBorrador: (args: {
    destinatario: string;
    asunto: string;
    contenido: string;
  }) => Promise<void> | void;
}) {
  const [destinatario, setDestinatario] = useState<string>("todos");
  const [apoderadoIndividualId, setApoderadoIndividualId] = useState<string>("");
  const [asunto, setAsunto] = useState("");
  const [contenido, setContenido] = useState("");
  const [programar, setProgramar] = useState(false);
  const [fechaProgramada, setFechaProgramada] = useState("");
  const [interactivo, setInteractivo] = useState(false);
  const [botonesTexto, setBotonesTexto] = useState("Autorizo, No autorizo");
  const [enviando, setEnviando] = useState(false);

  const reset = () => {
    setDestinatario("todos");
    setApoderadoIndividualId("");
    setAsunto("");
    setContenido("");
    setProgramar(false);
    setFechaProgramada("");
    setInteractivo(false);
    setBotonesTexto("Autorizo, No autorizo");
  };

  const destinatarioLabel = (): string => {
    switch (destinatario) {
      case "todos":
        return "Todos los apoderados";
      case "sala-cuna-mayor":
        return "Apoderados Sala Cuna Mayor";
      case "medio-menor":
        return "Apoderados Medio Menor";
      case "medio-mayor":
        return "Apoderados Medio Mayor";
      case "educadoras":
        return "Equipo educadoras";
      case "individual": {
        const a = apoderados.find((x) => String(x.id) === apoderadoIndividualId);
        return a ? `${a.nombre} ${a.apellido}` : "Apoderado individual";
      }
      default:
        return destinatario;
    }
  };

  const enviar = async () => {
    if (!asunto.trim() || !contenido.trim()) {
      toast.error("Completa el asunto y el contenido del mensaje");
      return;
    }
    if (programar) {
      toast.success("Mensaje programado", {
        description: `Se enviará el ${fechaProgramada}`,
      });
      reset();
      onOpenChange(false);
      return;
    }

    setEnviando(true);
    try {
      if (destinatario === "individual" && apoderadoIndividualId) {
        const botones = interactivo
          ? botonesTexto
              .split(",")
              .map((b) => b.trim())
              .filter(Boolean)
          : null;
        await onEnviar({
          destinatarioId: Number(apoderadoIndividualId),
          asunto,
          contenido,
          interactivo: botones && botones.length > 0 ? { botones } : null,
        });
      } else {
        // Envíos grupales: por ahora solo aviso en demo
        toast.success("Mensaje enviado", {
          description: `Enviado a ${destinatarioLabel()}`,
        });
      }
      reset();
      onOpenChange(false);
    } finally {
      setEnviando(false);
    }
  };

  const guardarBorrador = async () => {
    if (!asunto.trim() && !contenido.trim()) {
      toast.error("No hay nada para guardar");
      return;
    }
    await onGuardarBorrador({
      destinatario: destinatarioLabel(),
      asunto: asunto || "(Sin asunto)",
      contenido: contenido || "",
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading">Nuevo mensaje</DialogTitle>
          <DialogDescription>
            Envía un mensaje individual o grupal a la comunidad educativa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destinatario">Destinatario</Label>
            <Select value={destinatario} onValueChange={setDestinatario}>
              <SelectTrigger id="destinatario" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los apoderados</SelectItem>
                <SelectItem value="sala-cuna-mayor">Sala Cuna Mayor</SelectItem>
                <SelectItem value="medio-menor">Medio Menor</SelectItem>
                <SelectItem value="medio-mayor">Medio Mayor</SelectItem>
                <SelectItem value="educadoras">Solo educadoras</SelectItem>
                <SelectItem value="individual">Apoderado individual…</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {destinatario === "individual" && (
            <div className="space-y-2">
              <Label htmlFor="apoderado-individual">Apoderado</Label>
              <Select
                value={apoderadoIndividualId}
                onValueChange={setApoderadoIndividualId}
              >
                <SelectTrigger id="apoderado-individual" className="w-full">
                  <SelectValue placeholder="Selecciona un apoderado" />
                </SelectTrigger>
                <SelectContent>
                  {apoderados.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.nombre} {a.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="asunto">Asunto</Label>
            <Input
              id="asunto"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Ej: Reunión de apoderados"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contenido">Mensaje</Label>
            <Textarea
              id="contenido"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Escribe el contenido del mensaje…"
              rows={5}
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
                  description: "Funcionalidad disponible en la versión final.",
                })
              }
            >
              <RiAttachment2 className="size-4" />
              Adjuntar archivo
            </Button>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="programar" className="cursor-pointer">
                  Programar envío
                </Label>
                <p className="text-muted-foreground text-xs">
                  El mensaje se enviará en la fecha y hora indicada
                </p>
              </div>
              <Switch
                id="programar"
                checked={programar}
                onCheckedChange={setProgramar}
              />
            </div>

            {programar && (
              <div className="space-y-2">
                <Label htmlFor="fecha-programada" className="sr-only">
                  Fecha de envío
                </Label>
                <Input
                  id="fecha-programada"
                  type="datetime-local"
                  value={fechaProgramada}
                  onChange={(e) => setFechaProgramada(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="interactivo" className="cursor-pointer">
                  Mensaje interactivo
                </Label>
                <p className="text-muted-foreground text-xs">
                  Agrega botones de respuesta (ej: Autorizo / No autorizo)
                </p>
              </div>
              <Switch
                id="interactivo"
                checked={interactivo}
                onCheckedChange={setInteractivo}
              />
            </div>

            {interactivo && (
              <div className="space-y-2">
                <Label htmlFor="botones">
                  Opciones de respuesta (separadas por coma)
                </Label>
                <Input
                  id="botones"
                  value={botonesTexto}
                  onChange={(e) => setBotonesTexto(e.target.value)}
                  placeholder="Ej: Autorizo, No autorizo"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
            disabled={enviando}
          >
            Cancelar
          </Button>
          <Button
            variant="ghost"
            onClick={() => void guardarBorrador()}
            disabled={enviando}
          >
            Guardar borrador
          </Button>
          <Button
            onClick={() => void enviar()}
            className="gap-1.5"
            disabled={enviando}
          >
            {programar ? (
              <>
                <RiTimeLine className="size-4" />
                Programar
              </>
            ) : (
              <>
                <RiSendPlaneFill className="size-4" />
                {enviando ? "Enviando…" : "Enviar"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
