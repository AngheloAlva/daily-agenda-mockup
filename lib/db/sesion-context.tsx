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
import { useDbContext } from "./provider";
import { getById as getCentroById, listAll as listCentros } from "./repositories/centros";
import {
  getUsuarioActivo,
  setCentroActivo as setCentroActivoDb,
  setUsuarioActivo as setUsuarioActivoDb,
} from "./repositories/sesion";
import { listParaSwitcher } from "./repositories/usuarios";
import { getFechaDemoActual } from "./repositories/asistencia";
import type { Centro, Usuario } from "./types";

type ReadyValue = {
  status: "ready";
  usuario: Usuario;
  centroActivo: Centro;
  centros: Centro[];
  usuarios: Usuario[];
  esSuperAdmin: boolean;
  fechaHoyDemo: string | null;
  // "Ahora" según el demo: fechaHoyDemo a las 18:00, o Date real si no hay seed.
  // Pasarlo a formatDistance / calcularEdad para que los textos relativos sean
  // coherentes con el resto de los datos.
  nowDemo: Date;
  cambiarUsuario: (usuarioId: number) => Promise<void>;
  cambiarCentro: (centroId: number) => Promise<void>;
  refresh: () => Promise<void>;
};

type SesionValue =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | ReadyValue;

const SesionContext = createContext<SesionValue | null>(null);

async function cargarSesionCompleta(db: PGlite) {
  const [usuario, centros, usuarios, fechaHoyDemo] = await Promise.all([
    getUsuarioActivo(db),
    listCentros(db),
    listParaSwitcher(db),
    getFechaDemoActual(db),
  ]);
  if (!usuario) {
    throw new Error("No hay usuario activo en la sesión.");
  }
  // Determinar centro activo: prioridad a centro_activo_id de la sesión
  const sesionRow = await db.query<{ centro_activo_id: number | null }>(
    `SELECT centro_activo_id FROM sesion WHERE id = 1`,
  );
  let centroActivoId = sesionRow.rows[0]?.centro_activo_id ?? null;
  // Para usuarios no super-admin, el centro activo debe ser su propio centro
  if (!usuario.superAdmin && usuario.centroId != null) {
    centroActivoId = usuario.centroId;
  }
  // Fallback: si no hay centro asignado, primer centro disponible
  if (centroActivoId == null) {
    centroActivoId = centros[0]?.id ?? null;
  }
  const centroActivo =
    centroActivoId != null ? await getCentroById(db, centroActivoId) : null;
  if (!centroActivo) {
    throw new Error("No se pudo determinar el centro activo.");
  }
  // Persistir el centro activo si difiere del guardado (autocorrección)
  if (centroActivoId !== sesionRow.rows[0]?.centro_activo_id) {
    await setCentroActivoDb(db, centroActivoId);
  }
  return { usuario, centroActivo, centros, usuarios, fechaHoyDemo };
}

export function SesionProvider({ children }: { children: ReactNode }) {
  const dbCtx = useDbContext();
  const [value, setValue] = useState<SesionValue>({ status: "loading" });

  const load = useCallback(async () => {
    if (dbCtx.status !== "ready") return;
    try {
      const data = await cargarSesionCompleta(dbCtx.db);
      const nowDemo = data.fechaHoyDemo
        ? new Date(`${data.fechaHoyDemo}T18:00:00`)
        : new Date();
      const ready: ReadyValue = {
        status: "ready",
        ...data,
        nowDemo,
        esSuperAdmin: data.usuario.superAdmin,
        cambiarUsuario: async (id) => {
          await setUsuarioActivoDb(dbCtx.db, id);
          // Si el nuevo usuario tiene centro_id, alinear centro activo
          const nuevoUsuario = data.usuarios.find((u) => u.id === id);
          if (nuevoUsuario && !nuevoUsuario.superAdmin && nuevoUsuario.centroId != null) {
            await setCentroActivoDb(dbCtx.db, nuevoUsuario.centroId);
          }
          await load();
        },
        cambiarCentro: async (id) => {
          await setCentroActivoDb(dbCtx.db, id);
          await load();
        },
        refresh: load,
      };
      setValue(ready);
    } catch (e) {
      setValue({
        status: "error",
        error: e instanceof Error ? e : new Error(String(e)),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbCtx.status, dbCtx.status === "ready" ? dbCtx.db : null]);

  useEffect(() => {
    if (dbCtx.status === "loading") {
      setValue({ status: "loading" });
      return;
    }
    if (dbCtx.status === "error") {
      setValue({ status: "error", error: dbCtx.error });
      return;
    }
    void load();
  }, [dbCtx.status, load, dbCtx]);

  return <SesionContext.Provider value={value}>{children}</SesionContext.Provider>;
}

// Hook estricto: lanza si la sesión no está lista. Usar dentro de <SesionReady>.
export function useSesion(): ReadyValue {
  const ctx = useContext(SesionContext);
  if (!ctx) {
    throw new Error("useSesion debe usarse dentro de <SesionProvider>");
  }
  if (ctx.status !== "ready") {
    throw new Error(
      `useSesion() llamado mientras el estado es "${ctx.status}". ` +
        `Envolvé el árbol en <SesionReady>.`,
    );
  }
  return ctx;
}

export function useSesionEstado(): SesionValue {
  const ctx = useContext(SesionContext);
  if (!ctx) {
    throw new Error("useSesionEstado debe usarse dentro de <SesionProvider>");
  }
  return ctx;
}
