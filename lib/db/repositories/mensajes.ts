import type { PGlite } from "@electric-sql/pglite";
import type {
  ConversacionDetalle,
  ConversacionResumen,
  EstadoMensaje,
  MensajeDB,
  TipoMensajeContenido,
} from "../types";

const inicialesDe = (nombre: string, apellido: string) =>
  `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase();

type ConvResumenRow = {
  id: number;
  asunto: string;
  es_grupo: boolean;
  fijado: boolean;
  fecha_ultimo: string | null;
  preview: string | null;
  leido: boolean;
  otro_nombre: string | null;
  otro_apellido: string | null;
  otro_cargo: string | null;
};

export async function listConversaciones(
  db: PGlite,
  usuarioId: number,
): Promise<ConversacionResumen[]> {
  // Una sola query con subqueries para preview, último mensaje y "otro participante".
  // Aprovechamos SQL real: deriva todo en el servidor (=en WASM aquí, pero igual).
  const result = await db.query<ConvResumenRow>(
    `
    SELECT
      c.id, c.asunto, c.es_grupo, c.fijado,
      ult.fecha AS fecha_ultimo,
      ult.contenido AS preview,
      (CASE
        WHEN cp.ultima_lectura IS NULL THEN false
        WHEN ult.fecha IS NULL THEN true
        WHEN ult.fecha <= cp.ultima_lectura THEN true
        ELSE false
      END) AS leido,
      otro.nombre AS otro_nombre,
      otro.apellido AS otro_apellido,
      otro.cargo AS otro_cargo
    FROM conversaciones c
    JOIN conversacion_participantes cp
      ON cp.conversacion_id = c.id AND cp.usuario_id = $1
    LEFT JOIN LATERAL (
      SELECT fecha, contenido FROM mensajes
       WHERE conversacion_id = c.id
       ORDER BY fecha DESC LIMIT 1
    ) ult ON true
    LEFT JOIN LATERAL (
      SELECT u.nombre, u.apellido, u.cargo
        FROM conversacion_participantes cp2
        JOIN usuarios u ON u.id = cp2.usuario_id
       WHERE cp2.conversacion_id = c.id AND cp2.usuario_id <> $1
       ORDER BY cp2.usuario_id LIMIT 1
    ) otro ON true
    ORDER BY c.fijado DESC, COALESCE(ult.fecha, c.updated_at) DESC
    `,
    [usuarioId],
  );

  return result.rows.map((row) => {
    const esGrupo = row.es_grupo;
    const nombre = esGrupo
      ? "Dirección"
      : row.otro_nombre && row.otro_apellido
        ? `${row.otro_nombre} ${row.otro_apellido}`
        : "Sin destinatario";
    const rol = esGrupo
      ? "Comunicado institucional"
      : (row.otro_cargo ?? "Apoderado");
    const iniciales = esGrupo
      ? "DI"
      : row.otro_nombre && row.otro_apellido
        ? inicialesDe(row.otro_nombre, row.otro_apellido)
        : "??";

    return {
      id: row.id,
      asunto: row.asunto,
      esGrupo,
      fijado: row.fijado,
      fechaUltimo: row.fecha_ultimo,
      preview: row.preview,
      leido: row.leido,
      participanteNombre: nombre,
      participanteRol: rol,
      participanteIniciales: iniciales,
    };
  });
}

export async function contarNoLeidas(
  db: PGlite,
  usuarioId: number,
): Promise<number> {
  const result = await db.query<{ total: string }>(
    `
    SELECT COUNT(*)::text AS total
    FROM conversaciones c
    JOIN conversacion_participantes cp
      ON cp.conversacion_id = c.id AND cp.usuario_id = $1
    LEFT JOIN LATERAL (
      SELECT fecha FROM mensajes
       WHERE conversacion_id = c.id
       ORDER BY fecha DESC LIMIT 1
    ) ult ON true
    WHERE ult.fecha IS NOT NULL
      AND (cp.ultima_lectura IS NULL OR ult.fecha > cp.ultima_lectura)
    `,
    [usuarioId],
  );
  return Number(result.rows[0]?.total ?? 0);
}

type MensajeRow = {
  id: number;
  conversacion_id: number;
  autor_id: number;
  autor_nombre: string;
  autor_apellido: string;
  contenido: string;
  tipo: TipoMensajeContenido;
  botones: string[] | null;
  respuesta: string | null;
  estado: EstadoMensaje;
  fecha: string;
};

type ConvDetalleRow = {
  id: number;
  asunto: string;
  es_grupo: boolean;
  fijado: boolean;
  otro_nombre: string | null;
  otro_apellido: string | null;
  otro_cargo: string | null;
};

export async function getConversacion(
  db: PGlite,
  conversacionId: number,
  usuarioId: number,
): Promise<ConversacionDetalle | null> {
  const head = await db.query<ConvDetalleRow>(
    `
    SELECT c.id, c.asunto, c.es_grupo, c.fijado,
           otro.nombre AS otro_nombre,
           otro.apellido AS otro_apellido,
           otro.cargo AS otro_cargo
      FROM conversaciones c
      LEFT JOIN LATERAL (
        SELECT u.nombre, u.apellido, u.cargo
          FROM conversacion_participantes cp2
          JOIN usuarios u ON u.id = cp2.usuario_id
         WHERE cp2.conversacion_id = c.id AND cp2.usuario_id <> $2
         ORDER BY cp2.usuario_id LIMIT 1
      ) otro ON true
     WHERE c.id = $1
    `,
    [conversacionId, usuarioId],
  );
  const row = head.rows[0];
  if (!row) return null;

  const msgs = await db.query<MensajeRow>(
    `
    SELECT m.id, m.conversacion_id, m.autor_id,
           u.nombre AS autor_nombre, u.apellido AS autor_apellido,
           m.contenido, m.tipo, m.botones, m.respuesta, m.estado, m.fecha
      FROM mensajes m
      JOIN usuarios u ON u.id = m.autor_id
     WHERE m.conversacion_id = $1
     ORDER BY m.fecha
    `,
    [conversacionId],
  );

  const esGrupo = row.es_grupo;
  const nombre = esGrupo
    ? "Dirección"
    : row.otro_nombre && row.otro_apellido
      ? `${row.otro_nombre} ${row.otro_apellido}`
      : "Sin destinatario";
  const rol = esGrupo
    ? "Comunicado institucional"
    : (row.otro_cargo ?? "Apoderado");
  const iniciales = esGrupo
    ? "DI"
    : row.otro_nombre && row.otro_apellido
      ? inicialesDe(row.otro_nombre, row.otro_apellido)
      : "??";

  const mensajes: MensajeDB[] = msgs.rows.map((m) => ({
    id: m.id,
    conversacionId: m.conversacion_id,
    autorId: m.autor_id,
    autorNombre: `${m.autor_nombre} ${m.autor_apellido}`,
    autorIniciales: inicialesDe(m.autor_nombre, m.autor_apellido),
    esMio: m.autor_id === usuarioId,
    contenido: m.contenido,
    tipo: m.tipo,
    botones: m.botones,
    respuesta: m.respuesta,
    estado: m.estado,
    fecha: m.fecha,
  }));

  return {
    id: row.id,
    asunto: row.asunto,
    esGrupo,
    fijado: row.fijado,
    participanteNombre: nombre,
    participanteRol: rol,
    participanteIniciales: iniciales,
    mensajes,
  };
}

export async function marcarLeida(
  db: PGlite,
  conversacionId: number,
  usuarioId: number,
): Promise<void> {
  await db.query(
    `UPDATE conversacion_participantes
        SET ultima_lectura = now()
      WHERE conversacion_id = $1 AND usuario_id = $2`,
    [conversacionId, usuarioId],
  );
}

export async function responderInteractivo(
  db: PGlite,
  mensajeId: number,
  respuesta: string,
): Promise<void> {
  await db.query(
    `UPDATE mensajes SET respuesta = $1 WHERE id = $2 AND tipo = 'interactivo'`,
    [respuesta, mensajeId],
  );
}

export async function enviarMensaje(
  db: PGlite,
  conversacionId: number,
  autorId: number,
  contenido: string,
): Promise<number> {
  const mensajeId = await db.transaction(async (tx) => {
    const r = await tx.query<{ id: number }>(
      `INSERT INTO mensajes (conversacion_id, autor_id, contenido, tipo, estado)
       VALUES ($1, $2, $3, 'texto', 'enviado') RETURNING id`,
      [conversacionId, autorId, contenido],
    );
    await tx.query(
      `UPDATE conversaciones SET updated_at = now() WHERE id = $1`,
      [conversacionId],
    );
    // Marcamos la conversación como leída para el autor (acaba de escribirlo)
    await tx.query(
      `UPDATE conversacion_participantes
          SET ultima_lectura = now()
        WHERE conversacion_id = $1 AND usuario_id = $2`,
      [conversacionId, autorId],
    );

    // Notificación para los demás participantes
    const ctx = await tx.query<{
      asunto: string;
      autor_nombre: string;
      autor_apellido: string;
    }>(
      `SELECT c.asunto, u.nombre AS autor_nombre, u.apellido AS autor_apellido
         FROM conversaciones c, usuarios u
        WHERE c.id = $1 AND u.id = $2`,
      [conversacionId, autorId],
    );
    const cabecera = ctx.rows[0];
    if (cabecera) {
      const preview = contenido.length > 80 ? `${contenido.slice(0, 80)}…` : contenido;
      await tx.query(
        `INSERT INTO notificaciones
           (usuario_id, tipo, titulo, cuerpo, link, entidad_tipo, entidad_id)
         SELECT cp.usuario_id, 'mensaje', $3, $4, $5, 'conversacion', $1
           FROM conversacion_participantes cp
          WHERE cp.conversacion_id = $1 AND cp.usuario_id <> $2`,
        [
          conversacionId,
          autorId,
          `Nuevo mensaje de ${cabecera.autor_nombre} ${cabecera.autor_apellido}`,
          `${cabecera.asunto} · ${preview}`,
          "/dashboard/mensajes",
        ],
      );
    }
    return r.rows[0].id;
  });

  await db.query(`NOTIFY ${"notificaciones"}`);
  return mensajeId;
}

// Crea una conversación 1:1 con un destinatario y envía el primer mensaje.
// Si ya existe una conversación entre estos dos usuarios con el mismo asunto, la reutiliza.
export async function crearConversacionIndividual(
  db: PGlite,
  args: {
    autorId: number;
    destinatarioId: number;
    asunto: string;
    contenido: string;
    interactivo?: { botones: string[] } | null;
  },
): Promise<number> {
  const convId = await db.transaction(async (tx) => {
    const r = await tx.query<{ id: number }>(
      `INSERT INTO conversaciones (asunto, es_grupo, fijado)
       VALUES ($1, false, false) RETURNING id`,
      [args.asunto],
    );
    const id = r.rows[0].id;
    await tx.query(
      `INSERT INTO conversacion_participantes (conversacion_id, usuario_id, ultima_lectura)
       VALUES ($1, $2, now()), ($1, $3, NULL)`,
      [id, args.autorId, args.destinatarioId],
    );
    await tx.query(
      `INSERT INTO mensajes
         (conversacion_id, autor_id, contenido, tipo, botones, estado)
       VALUES ($1, $2, $3, $4, $5::jsonb, 'enviado')`,
      [
        id,
        args.autorId,
        args.contenido,
        args.interactivo ? "interactivo" : "texto",
        args.interactivo ? JSON.stringify(args.interactivo.botones) : null,
      ],
    );
    // Notif para el destinatario
    const autor = await tx.query<{ nombre: string; apellido: string }>(
      `SELECT nombre, apellido FROM usuarios WHERE id = $1`,
      [args.autorId],
    );
    const a = autor.rows[0];
    if (a) {
      const preview =
        args.contenido.length > 80
          ? `${args.contenido.slice(0, 80)}…`
          : args.contenido;
      await tx.query(
        `INSERT INTO notificaciones
           (usuario_id, tipo, titulo, cuerpo, link, entidad_tipo, entidad_id)
         VALUES ($1, 'mensaje', $2, $3, $4, 'conversacion', $5)`,
        [
          args.destinatarioId,
          `Nuevo mensaje de ${a.nombre} ${a.apellido}`,
          `${args.asunto} · ${preview}`,
          "/dashboard/mensajes",
          id,
        ],
      );
    }
    return id;
  });
  await db.query(`NOTIFY notificaciones`);
  return convId;
}
