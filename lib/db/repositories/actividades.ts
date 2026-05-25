import type { PGlite } from "@electric-sql/pglite";
import type { ActividadReciente } from "../types";

type ActividadRow = {
  id: number;
  tipo: "informe" | "mensaje" | "asistencia" | "evento";
  titulo: string;
  descripcion: string;
  fecha: string;
};

export async function listRecientes(
  db: PGlite,
  centroId: number,
  limit = 5,
): Promise<ActividadReciente[]> {
  const result = await db.query<ActividadRow>(
    `SELECT id, tipo, titulo, descripcion, fecha
       FROM actividades
      WHERE centro_id = $1
      ORDER BY fecha DESC
      LIMIT $2`,
    [centroId, limit],
  );
  return result.rows;
}
