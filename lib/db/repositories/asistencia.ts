import type { PGlite } from "@electric-sql/pglite";
import type {
  AsistenciaDia,
  EstadoAsistencia,
  NinoConAsistencia,
  ResumenDia,
} from "../types";

// La fecha "hoy" del demo no es la del reloj del visitante, sino la más reciente
// con datos en `asistencia`. Si no hay datos todavía, devuelve null.
export async function getFechaDemoActual(db: PGlite): Promise<string | null> {
  const r = await db.query<{ fecha: string | null }>(
    `SELECT MAX(fecha)::text AS fecha FROM asistencia`,
  );
  return r.rows[0]?.fecha ?? null;
}

type AsistenciaRow = {
  id: number;
  nombre: string;
  apellido: string;
  sala_id: number;
  sala_nombre: string;
  apoderado: string | null;
  estado: EstadoAsistencia | null;
  hora_llegada: string | null;
  hora_retiro: string | null;
  retirado_por: string | null;
};

export async function listAsistenciaDelDia(
  db: PGlite,
  centroId: number,
  fecha: string,
  salaId: number | null,
): Promise<NinoConAsistencia[]> {
  const result = await db.query<AsistenciaRow>(
    `
    SELECT n.id, n.nombre, n.apellido,
           n.sala_id, s.nombre AS sala_nombre,
           (u.nombre || ' ' || u.apellido) AS apoderado,
           a.estado, a.hora_llegada::text AS hora_llegada,
           a.hora_retiro::text AS hora_retiro,
           a.retirado_por
      FROM ninos n
      JOIN salas s ON s.id = n.sala_id
      LEFT JOIN nino_apoderado na ON na.nino_id = n.id AND na.principal = true
      LEFT JOIN usuarios u ON u.id = na.apoderado_id
      LEFT JOIN asistencia a ON a.nino_id = n.id AND a.fecha = $2::date
     WHERE n.centro_id = $1
       AND n.activo = true
       AND ($3::int IS NULL OR n.sala_id = $3)
     ORDER BY s.nombre, n.apellido, n.nombre
    `,
    [centroId, fecha, salaId],
  );

  return result.rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    apellido: r.apellido,
    salaId: r.sala_id,
    salaNombre: r.sala_nombre,
    apoderado: r.apoderado,
    estado: r.estado,
    horaLlegada: r.hora_llegada,
    horaRetiro: r.hora_retiro,
    retiradoPor: r.retirado_por,
  }));
}

export async function getResumenDia(
  db: PGlite,
  centroId: number,
  fecha: string,
  salaId: number | null,
): Promise<ResumenDia> {
  const result = await db.query<{
    total: string;
    presentes: string;
    ausentes: string;
    atrasados: string;
    sin_registro: string;
  }>(
    `
    SELECT
      COUNT(*)::text AS total,
      COUNT(*) FILTER (WHERE a.estado IN ('presente', 'retirado'))::text AS presentes,
      COUNT(*) FILTER (WHERE a.estado = 'ausente')::text AS ausentes,
      COUNT(*) FILTER (WHERE a.estado = 'atrasado')::text AS atrasados,
      COUNT(*) FILTER (WHERE a.estado IS NULL)::text AS sin_registro
    FROM ninos n
    LEFT JOIN asistencia a ON a.nino_id = n.id AND a.fecha = $2::date
    WHERE n.centro_id = $1
      AND n.activo = true
      AND ($3::int IS NULL OR n.sala_id = $3)
    `,
    [centroId, fecha, salaId],
  );
  const row = result.rows[0];
  return {
    total: Number(row?.total ?? 0),
    presentes: Number(row?.presentes ?? 0),
    ausentes: Number(row?.ausentes ?? 0),
    atrasados: Number(row?.atrasados ?? 0),
    sinRegistro: Number(row?.sin_registro ?? 0),
  };
}

const NOMBRE_DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export type FilaAsistenciaMensual = {
  ninoId: number;
  nombre: string;
  apellido: string;
  salaNombre: string;
  diasEstado: Record<string, "presente" | "ausente" | "atrasado" | "retirado">;
  presentes: number;
  ausentes: number;
  atrasados: number;
  totalDias: number;
};

// Matriz para reporte mensual: una fila por niño, una columna por día hábil del mes.
export async function getMatrizMensual(
  db: PGlite,
  centroId: number,
  anio: number,
  mes: number, // 1-12
): Promise<FilaAsistenciaMensual[]> {
  const inicio = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const fin = `${anio}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;

  type Row = {
    nino_id: number;
    nombre: string;
    apellido: string;
    sala_nombre: string;
    fecha: string | null;
    estado: "presente" | "ausente" | "atrasado" | "retirado" | null;
  };

  const result = await db.query<Row>(
    `
    SELECT n.id AS nino_id, n.nombre, n.apellido,
           s.nombre AS sala_nombre,
           a.fecha::text AS fecha, a.estado
      FROM ninos n
      JOIN salas s ON s.id = n.sala_id
      LEFT JOIN asistencia a ON a.nino_id = n.id
        AND a.fecha BETWEEN $2::date AND $3::date
     WHERE n.centro_id = $1 AND n.activo = true
     ORDER BY s.nombre, n.apellido, n.nombre
    `,
    [centroId, inicio, fin],
  );

  const byNino = new Map<number, FilaAsistenciaMensual>();
  for (const r of result.rows) {
    let fila = byNino.get(r.nino_id);
    if (!fila) {
      fila = {
        ninoId: r.nino_id,
        nombre: r.nombre,
        apellido: r.apellido,
        salaNombre: r.sala_nombre,
        diasEstado: {},
        presentes: 0,
        ausentes: 0,
        atrasados: 0,
        totalDias: 0,
      };
      byNino.set(r.nino_id, fila);
    }
    if (r.fecha && r.estado) {
      fila.diasEstado[r.fecha] = r.estado;
      fila.totalDias += 1;
      if (r.estado === "presente" || r.estado === "retirado") fila.presentes += 1;
      else if (r.estado === "ausente") fila.ausentes += 1;
      else if (r.estado === "atrasado") fila.atrasados += 1;
    }
  }
  return Array.from(byNino.values());
}

// Devuelve presentes vs ausentes de los últimos 5 días hábiles (Lun a Vie)
// terminando en la fecha indicada (inclusive si cae en hábil, sino el viernes anterior).
export async function getAsistenciaSemanal(
  db: PGlite,
  centroId: number,
  fechaHoy: string,
): Promise<AsistenciaDia[]> {
  // Calculamos en JS las 5 fechas hábiles más recientes para evitar generate_series
  // (PGlite las soporta, pero esto es más explícito).
  const fechas: Date[] = [];
  const cursor = new Date(`${fechaHoy}T00:00:00`);
  while (fechas.length < 5) {
    const dow = cursor.getDay();
    if (dow >= 1 && dow <= 5) {
      fechas.unshift(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  const fechasIso = fechas.map((d) => d.toISOString().slice(0, 10));

  const result = await db.query<{
    fecha: string;
    presentes: string;
    ausentes: string;
  }>(
    `
    SELECT
      a.fecha::text AS fecha,
      COUNT(*) FILTER (WHERE a.estado IN ('presente', 'atrasado', 'retirado'))::text AS presentes,
      COUNT(*) FILTER (WHERE a.estado = 'ausente')::text AS ausentes
    FROM asistencia a
    JOIN ninos n ON n.id = a.nino_id
    WHERE n.centro_id = $1
      AND a.fecha = ANY($2::date[])
    GROUP BY a.fecha
    `,
    [centroId, fechasIso],
  );

  const byFecha = new Map<string, { presentes: number; ausentes: number }>();
  for (const row of result.rows) {
    byFecha.set(row.fecha, {
      presentes: Number(row.presentes),
      ausentes: Number(row.ausentes),
    });
  }

  return fechas.map((d) => {
    const iso = d.toISOString().slice(0, 10);
    const row = byFecha.get(iso) ?? { presentes: 0, ausentes: 0 };
    return {
      fecha: iso,
      dia: NOMBRE_DIA[d.getDay()],
      presentes: row.presentes,
      ausentes: row.ausentes,
    };
  });
}

const horaPorDefecto = (estado: EstadoAsistencia): string | null => {
  if (estado === "presente") return "08:30:00";
  if (estado === "atrasado") return "09:45:00";
  return null;
};

// Establece el estado de asistencia. Crea el registro si no existe.
// Al cambiar de estado, limpia hora_retiro/retirado_por (un retiro pertenece al estado anterior).
export async function upsertEstado(
  db: PGlite,
  args: {
    ninoId: number;
    fecha: string;
    estado: EstadoAsistencia;
    usuarioId: number;
  },
): Promise<void> {
  const horaLlegada = horaPorDefecto(args.estado);
  await db.query(
    `
    INSERT INTO asistencia (nino_id, fecha, estado, hora_llegada, registrado_por)
    VALUES ($1, $2::date, $3, $4::time, $5)
    ON CONFLICT (nino_id, fecha)
    DO UPDATE SET
      estado = EXCLUDED.estado,
      hora_llegada = EXCLUDED.hora_llegada,
      hora_retiro = NULL,
      retirado_por = NULL,
      registrado_por = EXCLUDED.registrado_por
    `,
    [args.ninoId, args.fecha, args.estado, horaLlegada, args.usuarioId],
  );
}

// Registra un retiro anticipado. El niño queda en estado 'presente' (vino al jardín)
// pero con hora_retiro marcada. Si no había registro previo, lo crea.
export async function registrarRetiro(
  db: PGlite,
  args: {
    ninoId: number;
    fecha: string;
    horaRetiro: string; // "HH:MM"
    retiradoPor: string | null;
    usuarioId: number;
  },
): Promise<void> {
  const horaCompleta = args.horaRetiro.length === 5 ? `${args.horaRetiro}:00` : args.horaRetiro;
  await db.query(
    `
    INSERT INTO asistencia
      (nino_id, fecha, estado, hora_llegada, hora_retiro, retirado_por, registrado_por)
    VALUES ($1, $2::date, 'presente', '08:30:00'::time, $3::time, $4, $5)
    ON CONFLICT (nino_id, fecha)
    DO UPDATE SET
      estado = CASE WHEN asistencia.estado = 'ausente' THEN 'presente' ELSE asistencia.estado END,
      hora_retiro = EXCLUDED.hora_retiro,
      retirado_por = EXCLUDED.retirado_por,
      registrado_por = EXCLUDED.registrado_por
    `,
    [args.ninoId, args.fecha, horaCompleta, args.retiradoPor, args.usuarioId],
  );
}
