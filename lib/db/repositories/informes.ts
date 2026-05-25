import type { PGlite } from "@electric-sql/pglite";
import type {
  AnimoNino,
  EstadoAlimento,
  EstadoInforme,
  Informe,
  NinoConInforme,
  ResumenInformes,
} from "../types";

type RawRow = {
  nino_id: number;
  nombre: string;
  apellido: string;
  sala_id: number;
  sala_nombre: string;
  estado: EstadoInforme | null;
  desayuno: EstadoAlimento | null;
  almuerzo: EstadoAlimento | null;
  once: EstadoAlimento | null;
  siesta_inicio: string | null;
  siesta_fin: string | null;
  panal_cambios: number | null;
  animo: AnimoNino | null;
  actividades: string | null;
  observaciones: string | null;
  foto_cargada: boolean | null;
};

const informeVacio = (): Informe => ({
  estado: "pendiente",
  desayuno: null,
  almuerzo: null,
  once: null,
  siestaInicio: null,
  siestaFin: null,
  panalCambios: null,
  animo: null,
  actividades: null,
  observaciones: null,
  fotoCargada: false,
});

const mapInforme = (row: RawRow): Informe => ({
  estado: row.estado ?? "pendiente",
  desayuno: row.desayuno,
  almuerzo: row.almuerzo,
  once: row.once,
  siestaInicio: row.siesta_inicio ? row.siesta_inicio.slice(0, 5) : null,
  siestaFin: row.siesta_fin ? row.siesta_fin.slice(0, 5) : null,
  panalCambios: row.panal_cambios,
  animo: row.animo,
  actividades: row.actividades,
  observaciones: row.observaciones,
  fotoCargada: row.foto_cargada ?? false,
});

// Lista niños no-ausentes del día con su informe (vacío si no existe todavía).
export async function listInformesDelDia(
  db: PGlite,
  centroId: number,
  fecha: string,
  salaId: number | null,
): Promise<NinoConInforme[]> {
  const result = await db.query<RawRow>(
    `
    SELECT n.id AS nino_id, n.nombre, n.apellido,
           n.sala_id, s.nombre AS sala_nombre,
           i.estado, i.desayuno, i.almuerzo, i.once,
           i.siesta_inicio::text AS siesta_inicio,
           i.siesta_fin::text AS siesta_fin,
           i.panal_cambios, i.animo, i.actividades, i.observaciones, i.foto_cargada
      FROM ninos n
      JOIN salas s ON s.id = n.sala_id
      LEFT JOIN asistencia a ON a.nino_id = n.id AND a.fecha = $2::date
      LEFT JOIN informes_diarios i ON i.nino_id = n.id AND i.fecha = $2::date
     WHERE n.centro_id = $1
       AND n.activo = true
       AND (a.estado IS NULL OR a.estado <> 'ausente')
       AND ($3::int IS NULL OR n.sala_id = $3)
     ORDER BY s.nombre, n.apellido, n.nombre
    `,
    [centroId, fecha, salaId],
  );

  return result.rows.map((row) => ({
    ninoId: row.nino_id,
    nombre: row.nombre,
    apellido: row.apellido,
    salaId: row.sala_id,
    salaNombre: row.sala_nombre,
    informe: row.estado ? mapInforme(row) : informeVacio(),
  }));
}

export async function getResumenInformes(
  db: PGlite,
  centroId: number,
  fecha: string,
  salaId: number | null,
): Promise<ResumenInformes> {
  const result = await db.query<{
    pendiente: string;
    borrador: string;
    publicado: string;
  }>(
    `
    SELECT
      COUNT(*) FILTER (WHERE COALESCE(i.estado, 'pendiente') = 'pendiente')::text AS pendiente,
      COUNT(*) FILTER (WHERE i.estado = 'borrador')::text AS borrador,
      COUNT(*) FILTER (WHERE i.estado = 'publicado')::text AS publicado
    FROM ninos n
    LEFT JOIN asistencia a ON a.nino_id = n.id AND a.fecha = $2::date
    LEFT JOIN informes_diarios i ON i.nino_id = n.id AND i.fecha = $2::date
    WHERE n.centro_id = $1
      AND n.activo = true
      AND (a.estado IS NULL OR a.estado <> 'ausente')
      AND ($3::int IS NULL OR n.sala_id = $3)
    `,
    [centroId, fecha, salaId],
  );
  const row = result.rows[0];
  return {
    pendiente: Number(row?.pendiente ?? 0),
    borrador: Number(row?.borrador ?? 0),
    publicado: Number(row?.publicado ?? 0),
  };
}

export async function upsertInforme(
  db: PGlite,
  args: {
    ninoId: number;
    fecha: string;
    autorId: number;
    estado: EstadoInforme;
    informe: Informe;
  },
): Promise<void> {
  const i = args.informe;
  await db.query(
    `
    INSERT INTO informes_diarios
      (nino_id, fecha, estado, desayuno, almuerzo, once,
       siesta_inicio, siesta_fin, panal_cambios, animo,
       actividades, observaciones, foto_cargada, autor_id, updated_at)
    VALUES ($1, $2::date, $3, $4, $5, $6,
            $7::time, $8::time, $9, $10,
            $11, $12, $13, $14, now())
    ON CONFLICT (nino_id, fecha)
    DO UPDATE SET
      estado = EXCLUDED.estado,
      desayuno = EXCLUDED.desayuno,
      almuerzo = EXCLUDED.almuerzo,
      once = EXCLUDED.once,
      siesta_inicio = EXCLUDED.siesta_inicio,
      siesta_fin = EXCLUDED.siesta_fin,
      panal_cambios = EXCLUDED.panal_cambios,
      animo = EXCLUDED.animo,
      actividades = EXCLUDED.actividades,
      observaciones = EXCLUDED.observaciones,
      foto_cargada = EXCLUDED.foto_cargada,
      autor_id = EXCLUDED.autor_id,
      updated_at = now()
    `,
    [
      args.ninoId,
      args.fecha,
      args.estado,
      i.desayuno,
      i.almuerzo,
      i.once,
      i.siestaInicio,
      i.siestaFin,
      i.panalCambios,
      i.animo,
      i.actividades,
      i.observaciones,
      i.fotoCargada,
      args.autorId,
    ],
  );
}
