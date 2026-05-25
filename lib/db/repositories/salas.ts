import type { PGlite } from "@electric-sql/pglite";
import type { Sala } from "../types";

type SalaRow = {
  id: number;
  centro_id: number;
  nombre: string;
  educadora_id: number | null;
  capacidad: number;
};

const mapSala = (row: SalaRow): Sala => ({
  id: row.id,
  centroId: row.centro_id,
  nombre: row.nombre,
  educadoraId: row.educadora_id,
  capacidad: row.capacidad,
});

export async function listByCentro(
  db: PGlite,
  centroId: number,
): Promise<Sala[]> {
  const result = await db.query<SalaRow>(
    `SELECT id, centro_id, nombre, educadora_id, capacidad
     FROM salas WHERE centro_id = $1 ORDER BY id`,
    [centroId],
  );
  return result.rows.map(mapSala);
}
