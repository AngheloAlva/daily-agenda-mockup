"use client";

import { useCallback, useRef, useState } from "react";
import type { PGlite } from "@electric-sql/pglite";
import { useDbContext } from "./provider";

type MutationState = {
  loading: boolean;
  error: Error | null;
};

export type UseDbMutationResult<TArgs extends unknown[], TResult> = MutationState & {
  mutate: (...args: TArgs) => Promise<TResult>;
};

// Hook para mutaciones. La función recibe la instancia de PGlite + argumentos
// y devuelve una promesa con el resultado. El llamador es responsable de
// llamar `refetch()` en las queries afectadas después de mutar.
export function useDbMutation<TArgs extends unknown[], TResult>(
  fn: (db: PGlite, ...args: TArgs) => Promise<TResult>,
): UseDbMutationResult<TArgs, TResult> {
  const ctx = useDbContext();
  const [state, setState] = useState<MutationState>({ loading: false, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const mutate = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      if (ctx.status !== "ready") {
        const err = new Error(
          `useDbMutation: base no lista (status="${ctx.status}").`,
        );
        setState({ loading: false, error: err });
        throw err;
      }
      setState({ loading: true, error: null });
      try {
        const result = await fnRef.current(ctx.db, ...args);
        setState({ loading: false, error: null });
        return result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setState({ loading: false, error: err });
        throw err;
      }
    },
    [ctx.status, ctx.status === "ready" ? ctx.db : null],
    // eslint-disable-next-line react-hooks/exhaustive-deps
  );

  return { ...state, mutate };
}
