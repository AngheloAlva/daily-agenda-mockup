"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { PGlite } from "@electric-sql/pglite";
import { getDb, resetDb } from "./client";

type DbContextValue =
  | { status: "loading"; db: null; error: null; reset: () => Promise<void> }
  | { status: "ready"; db: PGlite; error: null; reset: () => Promise<void> }
  | { status: "error"; db: null; error: Error; reset: () => Promise<void> };

const DbContext = createContext<DbContextValue | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<PGlite | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setDb(null);
      const instance = await getDb();
      setDb(instance);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, []);

  const reset = useCallback(async () => {
    try {
      setError(null);
      setDb(null);
      const instance = await resetDb();
      setDb(instance);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value: DbContextValue = error
    ? { status: "error", db: null, error, reset }
    : db
      ? { status: "ready", db, error: null, reset }
      : { status: "loading", db: null, error: null, reset };

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

export function useDbContext(): DbContextValue {
  const ctx = useContext(DbContext);
  if (!ctx) {
    throw new Error("useDbContext debe usarse dentro de <DbProvider>");
  }
  return ctx;
}

// Acceso directo a la instancia cuando el componente solo se renderiza si está lista.
// Lanza si la DB todavía no terminó de inicializar.
export function useDb(): PGlite {
  const ctx = useDbContext();
  if (ctx.status !== "ready") {
    throw new Error(
      `useDb() llamado mientras la base está en estado "${ctx.status}". ` +
        `Envolvé el árbol en <SesionReady> o checkeá useDbContext().status antes.`,
    );
  }
  return ctx.db;
}
