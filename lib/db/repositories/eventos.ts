import type { PGlite } from "@electric-sql/pglite";
import type { Evento, ProximoEvento, TipoEvento } from "../types";

type ProximoEventoRow = {
  id: number;
  titulo: string;
  fecha: string;
};

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const formatearFechaCorta = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} de ${MESES[d.getMonth()]}`;
};

type EventoRow = {
  id: number;
  centro_id: number;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  tipo: TipoEvento;
  modalidad: "presencial" | "online" | null;
  ubicacion: string | null;
  alcance_sala_id: number | null;
  alcance_sala_nombre: string | null;
  recordatorio: boolean;
};

const mapEvento = (row: EventoRow): Evento => ({
  id: row.id,
  centroId: row.centro_id,
  titulo: row.titulo,
  descripcion: row.descripcion,
  fecha: row.fecha,
  horaInicio: row.hora_inicio ? row.hora_inicio.slice(0, 5) : null,
  horaFin: row.hora_fin ? row.hora_fin.slice(0, 5) : null,
  tipo: row.tipo,
  modalidad: row.modalidad,
  ubicacion: row.ubicacion,
  alcanceSalaId: row.alcance_sala_id,
  alcanceSalaNombre: row.alcance_sala_nombre,
  recordatorio: row.recordatorio,
});

const SELECT_EVENTO = `
  SELECT e.id, e.centro_id, e.titulo, e.descripcion,
         e.fecha::text AS fecha,
         e.hora_inicio::text AS hora_inicio,
         e.hora_fin::text AS hora_fin,
         e.tipo, e.modalidad, e.ubicacion,
         e.alcance_sala_id,
         s.nombre AS alcance_sala_nombre,
         e.recordatorio
    FROM eventos e
    LEFT JOIN salas s ON s.id = e.alcance_sala_id
`;

export async function listByRango(
  db: PGlite,
  centroId: number,
  desde: string,
  hasta: string,
): Promise<Evento[]> {
  const result = await db.query<EventoRow>(
    `${SELECT_EVENTO}
      WHERE e.centro_id = $1
        AND e.fecha >= $2::date
        AND e.fecha <= $3::date
      ORDER BY e.fecha, COALESCE(e.hora_inicio, '00:00:00')`,
    [centroId, desde, hasta],
  );
  return result.rows.map(mapEvento);
}

export async function listProximos(
  db: PGlite,
  centroId: number,
  desdeFecha: string,
  limit = 5,
): Promise<Evento[]> {
  const result = await db.query<EventoRow>(
    `${SELECT_EVENTO}
      WHERE e.centro_id = $1
        AND e.tipo <> 'feriado'
        AND e.fecha >= $2::date
      ORDER BY e.fecha, COALESCE(e.hora_inicio, '00:00:00')
      LIMIT $3`,
    [centroId, desdeFecha, limit],
  );
  return result.rows.map(mapEvento);
}

export async function crear(
  db: PGlite,
  args: {
    centroId: number;
    titulo: string;
    descripcion: string | null;
    fecha: string;
    horaInicio: string | null;
    horaFin: string | null;
    tipo: TipoEvento;
    modalidad: "presencial" | "online" | null;
    ubicacion: string | null;
    alcanceSalaId: number | null;
    recordatorio: boolean;
    createdBy: number;
  },
): Promise<number> {
  const eventoId = await db.transaction(async (tx) => {
    const r = await tx.query<{ id: number }>(
      `INSERT INTO eventos
         (centro_id, titulo, descripcion, fecha, hora_inicio, hora_fin,
          tipo, modalidad, ubicacion, alcance_sala_id, recordatorio, created_by)
       VALUES ($1, $2, $3, $4::date, $5::time, $6::time,
               $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        args.centroId,
        args.titulo,
        args.descripcion,
        args.fecha,
        args.horaInicio,
        args.horaFin,
        args.tipo,
        args.modalidad,
        args.ubicacion,
        args.alcanceSalaId,
        args.recordatorio,
        args.createdBy,
      ],
    );
    const id = r.rows[0].id;

    // Si tiene recordatorio, notificar a todos los usuarios del centro
    // (excepto al autor, que ya sabe).
    if (args.recordatorio) {
      const cuerpo = `${args.fecha}${args.horaInicio ? ` · ${args.horaInicio.slice(0, 5)}` : ""}`;
      await tx.query(
        `INSERT INTO notificaciones
           (usuario_id, tipo, titulo, cuerpo, link, entidad_tipo, entidad_id)
         SELECT u.id, 'evento', $2, $3, $4, 'evento', $5
           FROM usuarios u
          WHERE u.centro_id = $1
            AND u.id <> $6
            AND u.activo = true`,
        [
          args.centroId,
          `Nuevo evento: ${args.titulo}`,
          cuerpo,
          "/dashboard/calendario",
          id,
          args.createdBy,
        ],
      );
    }
    return id;
  });
  await db.query(`NOTIFY notificaciones`);
  return eventoId;
}

// Próximo evento NO feriado del centro a partir de la fecha indicada.
export async function getProximoEvento(
  db: PGlite,
  centroId: number,
  desdeFecha: string,
): Promise<ProximoEvento | null> {
  const result = await db.query<ProximoEventoRow>(
    `
    SELECT id, titulo, fecha::text AS fecha
      FROM eventos
     WHERE centro_id = $1
       AND tipo <> 'feriado'
       AND fecha >= $2::date
     ORDER BY fecha, COALESCE(hora_inicio, '00:00:00')
     LIMIT 1
    `,
    [centroId, desdeFecha],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    titulo: row.titulo,
    fecha: row.fecha,
    fechaTexto: formatearFechaCorta(row.fecha),
  };
}
