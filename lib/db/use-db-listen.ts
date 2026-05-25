"use client";

import { useEffect, useRef } from "react";
import { useDbContext } from "./provider";

// Hook que se suscribe a un canal LISTEN de PGlite. Llama a `onNotify` cada vez
// que se emite NOTIFY al canal. Funciona con un único PGlite singleton — todos
// los listeners del proceso reciben la misma notificación.
export function useDbListen(
  canal: string,
  onNotify: (payload: string | undefined) => void,
): void {
  const ctx = useDbContext();
  const cbRef = useRef(onNotify);
  cbRef.current = onNotify;

  useEffect(() => {
    if (ctx.status !== "ready") return;
    let unsubscribe: (() => Promise<void>) | null = null;
    let cancelled = false;

    void ctx.db
      .listen(canal, (payload) => {
        cbRef.current(payload);
      })
      .then((unsub) => {
        if (cancelled) {
          // Si nos desmontamos antes de que listen() resuelva, deshacer
          void unsub();
        } else {
          unsubscribe = unsub;
        }
      });

    return () => {
      cancelled = true;
      if (unsubscribe) void unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.status, ctx.status === "ready" ? ctx.db : null, canal]);
}
