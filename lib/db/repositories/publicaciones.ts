import type { PGlite } from "@electric-sql/pglite";
import { formatTamano } from "@/lib/utils/format";
import type { AdjuntoPub, PublicacionFeed } from "../types";

const inicialesDe = (nombre: string, apellido: string) =>
  `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase();

type PublicacionRow = {
  id: number;
  autor_nombre: string;
  autor_apellido: string;
  autor_cargo: string | null;
  titulo: string;
  contenido: string;
  fecha: string;
  destacado: boolean;
  likes: string;
  comentarios: string;
  yo_like: boolean;
};

type AdjuntoRow = {
  id: number;
  entidad_id: number;
  nombre: string;
  tipo: "pdf" | "doc" | "imagen";
  tamano_bytes: string | null;
};

export async function listFeed(
  db: PGlite,
  centroId: number,
  usuarioId: number,
): Promise<PublicacionFeed[]> {
  const result = await db.query<PublicacionRow>(
    `
    SELECT
      p.id,
      u.nombre AS autor_nombre,
      u.apellido AS autor_apellido,
      u.cargo AS autor_cargo,
      p.titulo,
      p.contenido,
      p.fecha::text AS fecha,
      p.destacado,
      (SELECT COUNT(*) FROM publicacion_likes pl WHERE pl.publicacion_id = p.id)::text AS likes,
      (SELECT COUNT(*) FROM comentarios c WHERE c.publicacion_id = p.id)::text AS comentarios,
      EXISTS (
        SELECT 1 FROM publicacion_likes pl
         WHERE pl.publicacion_id = p.id AND pl.usuario_id = $2
      ) AS yo_like
    FROM publicaciones p
    JOIN usuarios u ON u.id = p.autor_id
    WHERE p.centro_id = $1
    ORDER BY p.destacado DESC, p.fecha DESC
    `,
    [centroId, usuarioId],
  );

  if (result.rows.length === 0) return [];

  const ids = result.rows.map((r) => r.id);
  const adjuntosResult = await db.query<AdjuntoRow>(
    `SELECT id, entidad_id, nombre, tipo, tamano_bytes::text AS tamano_bytes
       FROM adjuntos
      WHERE entidad = 'publicacion' AND entidad_id = ANY($1::int[])
      ORDER BY id`,
    [ids],
  );

  const adjuntosPorPub = new Map<number, AdjuntoPub[]>();
  for (const a of adjuntosResult.rows) {
    const lista = adjuntosPorPub.get(a.entidad_id) ?? [];
    lista.push({
      id: a.id,
      nombre: a.nombre,
      tipo: a.tipo,
      tamano: formatTamano(a.tamano_bytes ? Number(a.tamano_bytes) : null),
    });
    adjuntosPorPub.set(a.entidad_id, lista);
  }

  return result.rows.map((row) => ({
    id: row.id,
    autorNombre: `${row.autor_nombre} ${row.autor_apellido}`,
    autorRol: row.autor_cargo ?? "",
    autorIniciales: inicialesDe(row.autor_nombre, row.autor_apellido),
    titulo: row.titulo,
    contenido: row.contenido,
    fecha: row.fecha,
    destacado: row.destacado,
    likes: Number(row.likes),
    comentarios: Number(row.comentarios),
    yoLike: row.yo_like,
    adjuntos: adjuntosPorPub.get(row.id) ?? [],
  }));
}

export async function crear(
  db: PGlite,
  args: {
    centroId: number;
    autorId: number;
    titulo: string;
    contenido: string;
    destacado?: boolean;
  },
): Promise<number> {
  const r = await db.query<{ id: number }>(
    `INSERT INTO publicaciones (centro_id, autor_id, titulo, contenido, destacado)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      args.centroId,
      args.autorId,
      args.titulo,
      args.contenido,
      args.destacado ?? false,
    ],
  );
  return r.rows[0].id;
}

// Toggle atomico: si hay like lo borra, sino lo crea. Devuelve el nuevo estado.
export async function toggleLike(
  db: PGlite,
  publicacionId: number,
  usuarioId: number,
): Promise<boolean> {
  const deleted = await db.query<{ ok: number }>(
    `DELETE FROM publicacion_likes
      WHERE publicacion_id = $1 AND usuario_id = $2
      RETURNING 1 AS ok`,
    [publicacionId, usuarioId],
  );
  if (deleted.rows.length > 0) return false;

  await db.query(
    `INSERT INTO publicacion_likes (publicacion_id, usuario_id) VALUES ($1, $2)`,
    [publicacionId, usuarioId],
  );
  return true;
}
