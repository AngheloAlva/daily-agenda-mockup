import type { PGlite } from "@electric-sql/pglite";

export type TipoReporte =
  | "asistencia_mensual"
  | "asistencia_semanal"
  | "informe_parvulo"
  | "lista_apoderados"
  | "estado_cuentas"
  | "planificacion_mensual";

export type ReporteGenerado = {
  id: number;
  centroId: number;
  tipo: TipoReporte;
  parametros: Record<string, unknown>;
  generadoPorNombre: string;
  fecha: string;
  archivoNombre: string;
};

type Row = {
  id: number;
  centro_id: number;
  tipo: TipoReporte;
  parametros: Record<string, unknown> | string;
  generado_por_nombre: string;
  generado_por_apellido: string;
  fecha: string;
  archivo_nombre: string;
};

const map = (r: Row): ReporteGenerado => ({
  id: r.id,
  centroId: r.centro_id,
  tipo: r.tipo,
  parametros: typeof r.parametros === "string" ? JSON.parse(r.parametros) : r.parametros,
  generadoPorNombre: `${r.generado_por_nombre} ${r.generado_por_apellido}`,
  fecha: r.fecha,
  archivoNombre: r.archivo_nombre,
});

export async function listByCentro(
  db: PGlite,
  centroId: number,
  limit = 20,
): Promise<ReporteGenerado[]> {
  const result = await db.query<Row>(
    `SELECT r.id, r.centro_id, r.tipo, r.parametros,
            u.nombre AS generado_por_nombre, u.apellido AS generado_por_apellido,
            r.fecha::text AS fecha, r.archivo_nombre
       FROM reportes_generados r
       JOIN usuarios u ON u.id = r.generado_por
      WHERE r.centro_id = $1
      ORDER BY r.fecha DESC
      LIMIT $2`,
    [centroId, limit],
  );
  return result.rows.map(map);
}

export async function registrar(
  db: PGlite,
  args: {
    centroId: number;
    tipo: TipoReporte;
    parametros: Record<string, unknown>;
    generadoPor: number;
    archivoNombre: string;
  },
): Promise<number> {
  const r = await db.query<{ id: number }>(
    `INSERT INTO reportes_generados
       (centro_id, tipo, parametros, generado_por, archivo_nombre)
     VALUES ($1, $2, $3::jsonb, $4, $5) RETURNING id`,
    [
      args.centroId,
      args.tipo,
      JSON.stringify(args.parametros),
      args.generadoPor,
      args.archivoNombre,
    ],
  );
  return r.rows[0].id;
}
