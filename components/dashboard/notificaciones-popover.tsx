"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";
import {
  RiCalendarEventLine,
  RiCheckDoubleLine,
  RiCheckboxCircleLine,
  RiFileList3Line,
  RiMegaphoneLine,
  RiMessage3Line,
  RiNotification3Line,
  RiNotificationOffLine,
} from "@remixicon/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSesionEstado } from "@/lib/db/sesion-context";
import { useDbQuery } from "@/lib/db/use-db-query";
import { useDbMutation } from "@/lib/db/use-db-mutation";
import { useDbListen } from "@/lib/db/use-db-listen";
import {
  CANAL_NOTIFICACIONES,
  countNoLeidas,
  listForUser,
  marcarLeida,
  marcarTodasLeidas,
} from "@/lib/db/repositories/notificaciones";
import type { Notificacion, TipoNotificacion } from "@/lib/db/types";

const iconoPorTipo: Record<TipoNotificacion, React.ComponentType<{ className?: string }>> = {
  mensaje: RiMessage3Line,
  asistencia: RiCheckboxCircleLine,
  evento: RiCalendarEventLine,
  informe: RiFileList3Line,
  publicacion: RiMegaphoneLine,
  sistema: RiNotification3Line,
};

const tonoPorTipo: Record<TipoNotificacion, string> = {
  mensaje: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  asistencia: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  evento: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  informe: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
  publicacion: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
  sistema: "bg-muted text-muted-foreground",
};

export function NotificacionesPopover() {
  const sesion = useSesionEstado();
  const [open, setOpen] = useState(false);

  if (sesion.status !== "ready") {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Notificaciones">
        <RiNotification3Line className="size-5" />
      </Button>
    );
  }

  return (
    <NotificacionesPopoverReady
      usuarioId={sesion.usuario.id}
      nowDemo={sesion.nowDemo}
      open={open}
      setOpen={setOpen}
    />
  );
}

function NotificacionesPopoverReady({
  usuarioId,
  nowDemo,
  open,
  setOpen,
}: {
  usuarioId: number;
  nowDemo: Date;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {

  const listQuery = useDbQuery(
    (db) => listForUser(db, usuarioId, 20),
    [usuarioId],
  );
  const countQuery = useDbQuery(
    (db) => countNoLeidas(db, usuarioId),
    [usuarioId],
  );

  // Live updates: refetchea cuando llega un NOTIFY al canal
  useDbListen(CANAL_NOTIFICACIONES, () => {
    listQuery.refetch();
    countQuery.refetch();
  });

  const marcarLeidaMut = useDbMutation((db, id: number) => marcarLeida(db, id));
  const marcarTodasMut = useDbMutation((db, uid: number) =>
    marcarTodasLeidas(db, uid),
  );

  const notifs = listQuery.data ?? [];
  const noLeidas = countQuery.data ?? 0;

  const onAbrir = async (n: Notificacion) => {
    setOpen(false);
    if (!n.leida) {
      await marcarLeidaMut.mutate(n.id);
      listQuery.refetch();
      countQuery.refetch();
    }
  };

  const onMarcarTodas = async () => {
    try {
      await marcarTodasMut.mutate(usuarioId);
      listQuery.refetch();
      countQuery.refetch();
      toast.success("Notificaciones marcadas como leídas");
    } catch {
      toast.error("No se pudieron marcar como leídas");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} sin leer)` : ""}`}
        >
          <RiNotification3Line className="size-5" />
          {noLeidas > 0 && (
            <span className="bg-primary absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white">
              {noLeidas > 99 ? "99+" : noLeidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-semibold">
              Notificaciones
            </h3>
            {noLeidas > 0 && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground h-5 px-1.5 text-xs">
                {noLeidas}
              </Badge>
            )}
          </div>
          {noLeidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => void onMarcarTodas()}
              disabled={marcarTodasMut.loading}
            >
              <RiCheckDoubleLine className="size-3.5" />
              Marcar todas
            </Button>
          )}
        </div>

        {listQuery.loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <RiNotificationOffLine className="text-muted-foreground size-8 opacity-40" />
            <p className="text-muted-foreground text-sm">Sin notificaciones</p>
          </div>
        ) : (
          <ScrollArea className="h-[420px]">
            <ul className="divide-y">
              {notifs.map((n) => (
                <NotificacionItem
                  key={n.id}
                  notificacion={n}
                  nowDemo={nowDemo}
                  onAbrir={() => void onAbrir(n)}
                />
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificacionItem({
  notificacion,
  nowDemo,
  onAbrir,
}: {
  notificacion: Notificacion;
  nowDemo: Date;
  onAbrir: () => void;
}) {
  const Icon = iconoPorTipo[notificacion.tipo];
  const tono = tonoPorTipo[notificacion.tipo];
  const fecha = new Date(notificacion.fecha);

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
        !notificacion.leida && "bg-primary/[0.03]",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          tono,
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm",
              !notificacion.leida ? "font-semibold" : "font-medium",
            )}
          >
            {notificacion.titulo}
          </p>
          {!notificacion.leida && (
            <span className="bg-primary mt-1 size-1.5 shrink-0 rounded-full" />
          )}
        </div>
        <p className="text-muted-foreground line-clamp-2 text-xs">
          {notificacion.cuerpo}
        </p>
        <p className="text-muted-foreground text-[11px]">
          {formatDistance(fecha, nowDemo, { locale: es, addSuffix: true })}
        </p>
      </div>
    </div>
  );

  if (notificacion.link) {
    return (
      <li>
        <Link href={notificacion.link} onClick={onAbrir} className="block">
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button type="button" onClick={onAbrir} className="w-full text-left">
        {content}
      </button>
    </li>
  );
}
