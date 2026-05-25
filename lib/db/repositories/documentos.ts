import type { PGlite } from "@electric-sql/pglite";
import { formatTamano } from "@/lib/utils/format";
import type { DocumentoInstitucional } from "../types";

type DocumentoRow = {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha_actualizacion: string;
  tamano_bytes: string | null;
  tipo: "pdf" | "doc" | "imagen";
};

export async function listByCentro(
  db: PGlite,
  centroId: number,
): Promise<DocumentoInstitucional[]> {
  const result = await db.query<DocumentoRow>(
    `SELECT id, titulo, descripcion,
            fecha_actualizacion::text AS fecha_actualizacion,
            tamano_bytes::text AS tamano_bytes,
            tipo
       FROM documentos_institucionales
      WHERE centro_id = $1
      ORDER BY fecha_actualizacion DESC`,
    [centroId],
  );
  return result.rows.map((r) => ({
    id: r.id,
    titulo: r.titulo,
    descripcion: r.descripcion,
    fechaActualizacion: r.fecha_actualizacion,
    tamano: formatTamano(r.tamano_bytes ? Number(r.tamano_bytes) : null),
    tipo: r.tipo,
  }));
}
