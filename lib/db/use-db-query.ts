"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PGlite } from "@electric-sql/pglite";
import { useDbContext } from "./provider";

type QueryState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

export type UseDbQueryResult<T> = QueryState<T> & {
  refetch: () => void;
};

// Hook genérico para leer datos de PGlite desde un componente cliente.
// La función recibe la instancia de PGlite y devuelve una promesa con el dato.
// Las deps controlan cuándo re-ejecutar (igual semántica que useEffect).
export function useDbQuery<T>(
  fn: (db: PGlite) => Promise<T>,
  deps: ReadonlyArray<unknown>,
): UseDbQueryResult<T> {
  const ctx = useDbContext();
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const tick = useRef(0);

  // Mantenemos la última fn en un ref para no re-ejecutar al cambiar la referencia
  // mientras las deps explícitas no cambien.
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(() => {
    if (ctx.status !== "ready") {
      setState({ data: null, loading: ctx.status === "loading", error: ctx.error });
      return;
    }
    const myTick = ++tick.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    fnRef
      .current(ctx.db)
      .then((data) => {
        if (myTick !== tick.current) return; // cancelado por otra ejecución
        setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (myTick !== tick.current) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.status, ctx.status === "ready" ? ctx.db : null]);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, ...deps]);

  return { ...state, refetch: run };
}
