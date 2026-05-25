import type { PGlite } from "@electric-sql/pglite";
import type { Borrador } from "../types";

type BorradorRow = {
  id: number;
  destinatario: string;
  asunto: string;
  contenido: string;
  updated_at: string;
};

const mapBorrador = (row: BorradorRow): Borrador => ({
  id: row.id,
  destinatario: row.destinatario,
  asunto: row.asunto,
  contenido: row.contenido,
  preview: row.contenido.slice(0, 100),
  fecha: row.updated_at,
});

export async function listByAutor(
  db: PGlite,
  autorId: number,
): Promise<Borrador[]> {
  const result = await db.query<BorradorRow>(
    `SELECT id, destinatario, asunto, contenido, updated_at
       FROM borradores_mensaje
      WHERE autor_id = $1
      ORDER BY updated_at DESC`,
    [autorId],
  );
  return result.rows.map(mapBorrador);
}

export async function crear(
  db: PGlite,
  args: {
    centroId: number;
    autorId: number;
    destinatario: string;
    asunto: string;
    contenido: string;
  },
): Promise<number> {
  const r = await db.query<{ id: number }>(
    `INSERT INTO borradores_mensaje
       (centro_id, autor_id, destinatario, asunto, contenido)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [args.centroId, args.autorId, args.destinatario, args.asunto, args.contenido],
  );
  return r.rows[0].id;
}

export async function eliminar(db: PGlite, id: number): Promise<void> {
  await db.query(`DELETE FROM borradores_mensaje WHERE id = $1`, [id]);
}
