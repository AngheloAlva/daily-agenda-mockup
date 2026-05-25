import type { PGlite } from "@electric-sql/pglite";
import type { Centro } from "../types";

type CentroRow = {
  id: number;
  nombre: string;
  codigo: string;
  servicio: string | null;
  direccion: string | null;
  comuna: string | null;
  color_tema: string | null;
  activo: boolean;
};

const mapCentro = (row: CentroRow): Centro => ({
  id: row.id,
  nombre: row.nombre,
  codigo: row.codigo,
  servicio: row.servicio,
  direccion: row.direccion,
  comuna: row.comuna,
  colorTema: row.color_tema,
  activo: row.activo,
});

export async function listAll(db: PGlite): Promise<Centro[]> {
  const result = await db.query<CentroRow>(
    `SELECT id, nombre, codigo, servicio, direccion, comuna, color_tema, activo
       FROM centros WHERE activo = true ORDER BY nombre`,
  );
  return result.rows.map(mapCentro);
}

export async function getById(db: PGlite, id: number): Promise<Centro | null> {
  const result = await db.query<CentroRow>(
    `SELECT id, nombre, codigo, servicio, direccion, comuna, color_tema, activo
       FROM centros WHERE id = $1`,
    [id],
  );
  return result.rows[0] ? mapCentro(result.rows[0]) : null;
}
