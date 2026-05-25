// Repositorio de niños. Encapsula las queries SQL para que los componentes
// no manipulen SQL crudo. Patrón aplicable al resto de dominios cuando se
// migren las pantallas.

import type { PGlite } from "@electric-sql/pglite";
import type {
  ConteoCuentas,
  DocumentoFicha,
  Entrevista,
  FichaCompleta,
  Nino,
  NinoConApoderado,
  Persona,
} from "../types";

type NinoRow = {
  id: number;
  centro_id: number;
  nombre: string;
  apellido: string;
  sala_id: number;
  sala_nombre: string;
  fecha_nacimiento: string;
  rut: string | null;
  estado_cuenta: "activo" | "pendiente";
  fecha_matricula: string;
  activo: boolean;
};

type NinoConApoderadoRow = NinoRow & {
  apoderado_principal: string | null;
};

const mapNino = (row: NinoRow): Nino => ({
  id: row.id,
  centroId: row.centro_id,
  nombre: row.nombre,
  apellido: row.apellido,
  salaId: row.sala_id,
  salaNombre: row.sala_nombre,
  fechaNacimiento: row.fecha_nacimiento,
  rut: row.rut,
  estadoCuenta: row.estado_cuenta,
  fechaMatricula: row.fecha_matricula,
  activo: row.activo,
});

const mapNinoConApoderado = (row: NinoConApoderadoRow): NinoConApoderado => ({
  ...mapNino(row),
  apoderadoPrincipal: row.apoderado_principal,
});

const SELECT_NINO_BASE = `
  SELECT n.id, n.centro_id, n.nombre, n.apellido, n.sala_id,
         s.nombre AS sala_nombre,
         n.fecha_nacimiento, n.rut, n.estado_cuenta, n.fecha_matricula, n.activo
  FROM ninos n
  JOIN salas s ON s.id = n.sala_id
`;

const SELECT_NINO_CON_APODERADO = `
  ${SELECT_NINO_BASE}
  LEFT JOIN nino_apoderado na ON na.nino_id = n.id AND na.principal = true
  LEFT JOIN usuarios u ON u.id = na.apoderado_id
`;

export async function listByCentro(
  db: PGlite,
  centroId: number,
): Promise<NinoConApoderado[]> {
  const result = await db.query<NinoConApoderadoRow>(
    `${SELECT_NINO_CON_APODERADO},
       (u.nombre || ' ' || u.apellido) AS apoderado_principal
     WHERE n.centro_id = $1 AND n.activo = true
     ORDER BY s.nombre, n.apellido, n.nombre`,
    [centroId],
  );
  return result.rows.map(mapNinoConApoderado);
}

export async function getById(
  db: PGlite,
  ninoId: number,
): Promise<NinoConApoderado | null> {
  const result = await db.query<NinoConApoderadoRow>(
    `${SELECT_NINO_CON_APODERADO},
       (u.nombre || ' ' || u.apellido) AS apoderado_principal
     WHERE n.id = $1`,
    [ninoId],
  );
  return result.rows[0] ? mapNinoConApoderado(result.rows[0]) : null;
}

export async function countActivosByCentro(
  db: PGlite,
  centroId: number,
): Promise<number> {
  const result = await db.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM ninos WHERE centro_id = $1 AND activo = true`,
    [centroId],
  );
  return Number(result.rows[0]?.total ?? 0);
}

export async function getConteoCuentas(
  db: PGlite,
  centroId: number,
): Promise<ConteoCuentas> {
  const result = await db.query<{ estado_cuenta: "activo" | "pendiente"; total: string }>(
    `SELECT estado_cuenta, COUNT(*)::text AS total
     FROM ninos
     WHERE centro_id = $1 AND activo = true
     GROUP BY estado_cuenta`,
    [centroId],
  );
  const conteo: ConteoCuentas = { activos: 0, pendientes: 0 };
  for (const row of result.rows) {
    if (row.estado_cuenta === "activo") conteo.activos = Number(row.total);
    else conteo.pendientes = Number(row.total);
  }
  return conteo;
}

type FichaNinoRow = {
  id: number;
  centro_id: number;
  nombre: string;
  apellido: string;
  sala_id: number;
  sala_nombre: string;
  fecha_nacimiento: string;
  rut: string | null;
  nacionalidad: string | null;
  direccion: string | null;
  comuna: string | null;
  grupo_sanguineo: string | null;
  estado_cuenta: "activo" | "pendiente";
  prevision: string | null;
  alergias: string[] | null;
  enfermedades: string[] | null;
  seguro_escolar: boolean | null;
  dieta_especial: string | null;
  vive_con: string | null;
  ocupacion_madre: string | null;
  ocupacion_padre: string | null;
  periodo_adaptacion: string | null;
  observaciones: string | null;
  convivencia: string | null;
};

export async function getFichaCompleta(
  db: PGlite,
  ninoId: number,
): Promise<FichaCompleta | null> {
  const main = await db.query<FichaNinoRow>(
    `SELECT n.id, n.centro_id, n.nombre, n.apellido, n.sala_id,
            s.nombre AS sala_nombre,
            n.fecha_nacimiento, n.rut, n.nacionalidad, n.direccion, n.comuna,
            n.grupo_sanguineo, n.estado_cuenta,
            f.prevision, f.alergias, f.enfermedades, f.seguro_escolar,
            f.dieta_especial, f.vive_con, f.ocupacion_madre, f.ocupacion_padre,
            f.periodo_adaptacion, f.observaciones, f.convivencia
       FROM ninos n
       JOIN salas s ON s.id = n.sala_id
       LEFT JOIN nino_ficha f ON f.nino_id = n.id
      WHERE n.id = $1`,
    [ninoId],
  );
  const row = main.rows[0];
  if (!row) return null;

  const autorizadosResult = await db.query<{
    nombre: string;
    parentesco: string;
    telefono: string;
  }>(
    `SELECT nombre, parentesco, telefono
       FROM autorizados_retiro
      WHERE nino_id = $1
      ORDER BY id`,
    [ninoId],
  );

  const contactosResult = await db.query<{
    nombre: string;
    parentesco: string;
    telefono: string;
  }>(
    `SELECT nombre, parentesco, telefono
       FROM contactos_emergencia
      WHERE nino_id = $1
      ORDER BY orden, id`,
    [ninoId],
  );

  const entrevistasResult = await db.query<{
    id: number;
    fecha: string;
    titulo: string;
    realizada: boolean;
  }>(
    `SELECT id, fecha, titulo, realizada
       FROM entrevistas
      WHERE nino_id = $1
      ORDER BY fecha`,
    [ninoId],
  );

  const documentosResult = await db.query<{
    id: number;
    nombre: string;
    tipo: "pdf" | "doc" | "imagen";
    tamano_bytes: string | null;
    fecha: string;
  }>(
    `SELECT id, nombre, tipo, tamano_bytes::text AS tamano_bytes, fecha
       FROM adjuntos
      WHERE entidad = 'nino' AND entidad_id = $1
      ORDER BY fecha DESC, id`,
    [ninoId],
  );

  const autorizadosRetiro: Persona[] = autorizadosResult.rows;
  const contactosEmergencia: Persona[] = contactosResult.rows;
  const entrevistas: Entrevista[] = entrevistasResult.rows;
  const documentos: DocumentoFicha[] = documentosResult.rows.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    tipo: d.tipo,
    tamanoBytes: d.tamano_bytes ? Number(d.tamano_bytes) : null,
    fecha: d.fecha,
  }));

  return {
    nino: {
      id: row.id,
      centroId: row.centro_id,
      nombre: row.nombre,
      apellido: row.apellido,
      salaId: row.sala_id,
      salaNombre: row.sala_nombre,
      fechaNacimiento: row.fecha_nacimiento,
      rut: row.rut,
      nacionalidad: row.nacionalidad,
      direccion: row.direccion,
      comuna: row.comuna,
      grupoSanguineo: row.grupo_sanguineo,
      estadoCuenta: row.estado_cuenta,
    },
    ficha: {
      prevision: row.prevision,
      alergias: row.alergias ?? [],
      enfermedades: row.enfermedades ?? [],
      seguroEscolar: row.seguro_escolar ?? false,
      dietaEspecial: row.dieta_especial,
      viveCon: row.vive_con,
      ocupacionMadre: row.ocupacion_madre,
      ocupacionPadre: row.ocupacion_padre,
      periodoAdaptacion: row.periodo_adaptacion,
      observaciones: row.observaciones,
      convivencia: row.convivencia,
    },
    autorizadosRetiro,
    contactosEmergencia,
    entrevistas,
    documentos,
  };
}
