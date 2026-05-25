import type { PGlite } from "@electric-sql/pglite";
import type { Notificacion, TipoNotificacion } from "../types";

// Canal global de PostgreSQL para LISTEN/NOTIFY. Cualquier inserción notifica
// a todos los listeners; el cliente refetchea su lista.
export const CANAL_NOTIFICACIONES = "notificaciones";

type Row = {
  id: number;
  usuario_id: number;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  link: string | null;
  entidad_tipo: string | null;
  entidad_id: number | null;
  leida: boolean;
  fecha: string;
};

const map = (r: Row): Notificacion => ({
  id: r.id,
  usuarioId: r.usuario_id,
  tipo: r.tipo,
  titulo: r.titulo,
  cuerpo: r.cuerpo,
  link: r.link,
  entidadTipo: r.entidad_tipo,
  entidadId: r.entidad_id,
  leida: r.leida,
  fecha: r.fecha,
});

export async function listForUser(
  db: PGlite,
  usuarioId: number,
  limit = 20,
): Promise<Notificacion[]> {
  const result = await db.query<Row>(
    `SELECT id, usuario_id, tipo, titulo, cuerpo, link,
            entidad_tipo, entidad_id, leida, fecha
       FROM notificaciones
      WHERE usuario_id = $1
      ORDER BY fecha DESC
      LIMIT $2`,
    [usuarioId, limit],
  );
  return result.rows.map(map);
}

export async function countNoLeidas(
  db: PGlite,
  usuarioId: number,
): Promise<number> {
  const result = await db.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total
       FROM notificaciones
      WHERE usuario_id = $1 AND leida = false`,
    [usuarioId],
  );
  return Number(result.rows[0]?.total ?? 0);
}

export async function marcarLeida(db: PGlite, id: number): Promise<void> {
  await db.query(
    `UPDATE notificaciones
        SET leida = true, leida_at = now()
      WHERE id = $1 AND leida = false`,
    [id],
  );
}

export async function marcarTodasLeidas(
  db: PGlite,
  usuarioId: number,
): Promise<void> {
  await db.query(
    `UPDATE notificaciones
        SET leida = true, leida_at = now()
      WHERE usuario_id = $1 AND leida = false`,
    [usuarioId],
  );
}

// Crea una notificación y emite NOTIFY para que los listeners refetcheen.
// Si se pasan múltiples destinatarios, hace un INSERT batched.
export async function crear(
  db: PGlite,
  args: {
    usuariosIds: number[];
    tipo: TipoNotificacion;
    titulo: string;
    cuerpo: string;
    link?: string | null;
    entidadTipo?: string | null;
    entidadId?: number | null;
  },
): Promise<void> {
  if (args.usuariosIds.length === 0) return;
  // INSERT multi-fila con unnest
  await db.query(
    `INSERT INTO notificaciones
       (usuario_id, tipo, titulo, cuerpo, link, entidad_tipo, entidad_id)
     SELECT u, $2, $3, $4, $5, $6, $7
       FROM unnest($1::int[]) AS u`,
    [
      args.usuariosIds,
      args.tipo,
      args.titulo,
      args.cuerpo,
      args.link ?? null,
      args.entidadTipo ?? null,
      args.entidadId ?? null,
    ],
  );
  await db.query(`NOTIFY ${CANAL_NOTIFICACIONES}`);
}
