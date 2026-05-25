"use client";

import type { ReactNode } from "react";
import { useSesionEstado } from "./sesion-context";

// Gate que solo renderiza los hijos cuando la sesión está lista.
export function SesionReady({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const ctx = useSesionEstado();

  if (ctx.status === "loading") {
    return (
      <>
        {fallback ?? (
          <div className="flex h-full min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
            Cargando datos del demo…
          </div>
        )}
      </>
    );
  }

  if (ctx.status === "error") {
    return (
      <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-2 text-sm">
        <p className="text-destructive">No se pudo iniciar la sesión.</p>
        <p className="text-muted-foreground">{ctx.error.message}</p>
      </div>
    );
  }

  return <>{children}</>;
}
