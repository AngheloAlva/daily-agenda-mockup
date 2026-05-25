import type { PGlite } from "@electric-sql/pglite";
import type {
  AmbitoAprendizaje,
  EstadoPlanificacion,
  Experiencia,
  PlanificacionDetalle,
  PlanificacionResumen,
  ResumenPlanificaciones,
} from "../types";

type PlanificacionRow = {
  id: number;
  centro_id: number;
  sala_id: number;
  sala_nombre: string;
  titulo: string;
  periodo_inicio: string;
  periodo_fin: string;
  ambito: AmbitoAprendizaje;
  objetivo_general: string;
  estado: EstadoPlanificacion;
  autor_nombre: string;
  autor_apellido: string;
  aprobada_nombre: string | null;
  aprobada_apellido: string | null;
  total_experiencias: string;
  experiencias_realizadas: string;
};

const mapPlanificacion = (row: PlanificacionRow): PlanificacionResumen => ({
  id: row.id,
  centroId: row.centro_id,
  salaId: row.sala_id,
  salaNombre: row.sala_nombre,
  titulo: row.titulo,
  periodoInicio: row.periodo_inicio,
  periodoFin: row.periodo_fin,
  ambito: row.ambito,
  objetivoGeneral: row.objetivo_general,
  estado: row.estado,
  autorNombre: `${row.autor_nombre} ${row.autor_apellido}`,
  aprobadaPor:
    row.aprobada_nombre && row.aprobada_apellido
      ? `${row.aprobada_nombre} ${row.aprobada_apellido}`
      : null,
  totalExperiencias: Number(row.total_experiencias),
  experienciasRealizadas: Number(row.experiencias_realizadas),
});

const SELECT_PLANIFICACION = `
  SELECT p.id, p.centro_id, p.sala_id,
         s.nombre AS sala_nombre,
         p.titulo,
         p.periodo_inicio::text AS periodo_inicio,
         p.periodo_fin::text AS periodo_fin,
         p.ambito, p.objetivo_general, p.estado,
         autor.nombre AS autor_nombre, autor.apellido AS autor_apellido,
         aprob.nombre AS aprobada_nombre, aprob.apellido AS aprobada_apellido,
         (SELECT COUNT(*) FROM experiencias_aprendizaje e WHERE e.planificacion_id = p.id)::text AS total_experiencias,
         (SELECT COUNT(*) FROM experiencias_aprendizaje e
            WHERE e.planificacion_id = p.id AND e.realizada = true)::text AS experiencias_realizadas
    FROM planificaciones p
    JOIN salas s ON s.id = p.sala_id
    JOIN usuarios autor ON autor.id = p.autor_id
    LEFT JOIN usuarios aprob ON aprob.id = p.aprobada_por
`;

export async function listByCentro(
  db: PGlite,
  centroId: number,
  salaId: number | null,
): Promise<PlanificacionResumen[]> {
  const result = await db.query<PlanificacionRow>(
    `${SELECT_PLANIFICACION}
      WHERE p.centro_id = $1
        AND ($2::int IS NULL OR p.sala_id = $2)
      ORDER BY p.periodo_inicio DESC, p.id DESC`,
    [centroId, salaId],
  );
  return result.rows.map(mapPlanificacion);
}

export async function getResumen(
  db: PGlite,
  centroId: number,
): Promise<ResumenPlanificaciones> {
  const result = await db.query<{
    total: string;
    borrador: string;
    aprobada: string;
    archivada: string;
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE estado = 'borrador')::text AS borrador,
       COUNT(*) FILTER (WHERE estado = 'aprobada')::text AS aprobada,
       COUNT(*) FILTER (WHERE estado = 'archivada')::text AS archivada
     FROM planificaciones
     WHERE centro_id = $1`,
    [centroId],
  );
  const row = result.rows[0];
  return {
    total: Number(row?.total ?? 0),
    borrador: Number(row?.borrador ?? 0),
    aprobada: Number(row?.aprobada ?? 0),
    archivada: Number(row?.archivada ?? 0),
  };
}

type ExperienciaRow = {
  id: number;
  fecha: string;
  titulo: string;
  descripcion: string;
  materiales: string[] | null;
  duracion_min: number | null;
  realizada: boolean;
  evaluacion: string | null;
};

export async function getById(
  db: PGlite,
  id: number,
): Promise<PlanificacionDetalle | null> {
  const head = await db.query<PlanificacionRow>(
    `${SELECT_PLANIFICACION} WHERE p.id = $1`,
    [id],
  );
  const row = head.rows[0];
  if (!row) return null;

  const exps = await db.query<ExperienciaRow>(
    `SELECT id, fecha::text AS fecha, titulo, descripcion,
            materiales, duracion_min, realizada, evaluacion
       FROM experiencias_aprendizaje
      WHERE planificacion_id = $1
      ORDER BY fecha, id`,
    [id],
  );

  const experiencias: Experiencia[] = exps.rows.map((e) => ({
    id: e.id,
    fecha: e.fecha,
    titulo: e.titulo,
    descripcion: e.descripcion,
    materiales: e.materiales ?? [],
    duracionMin: e.duracion_min,
    realizada: e.realizada,
    evaluacion: e.evaluacion,
  }));

  return {
    ...mapPlanificacion(row),
    experiencias,
  };
}

export async function toggleExperienciaRealizada(
  db: PGlite,
  experienciaId: number,
  realizada: boolean,
): Promise<void> {
  await db.query(
    `UPDATE experiencias_aprendizaje SET realizada = $1 WHERE id = $2`,
    [realizada, experienciaId],
  );
}
