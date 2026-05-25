import type { PGlite } from "@electric-sql/pglite";
import type { ApoderadoLite, Usuario } from "../types";

const inicialesDe = (nombre: string, apellido: string) =>
  `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase();

type ApoderadoRow = {
  id: number;
  nombre: string;
  apellido: string;
};

export async function listApoderadosByCentro(
  db: PGlite,
  centroId: number,
): Promise<ApoderadoLite[]> {
  const result = await db.query<ApoderadoRow>(
    `SELECT id, nombre, apellido
       FROM usuarios
      WHERE centro_id = $1 AND rol = 'apoderado' AND activo = true
      ORDER BY apellido, nombre`,
    [centroId],
  );
  return result.rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    apellido: r.apellido,
    iniciales: inicialesDe(r.nombre, r.apellido),
  }));
}

type UsuarioRow = {
  id: number;
  centro_id: number | null;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  rol: "directora" | "docente" | "apoderado";
  cargo: string | null;
  super_admin: boolean;
  activo: boolean;
};

const mapUsuario = (r: UsuarioRow): Usuario => ({
  id: r.id,
  centroId: r.centro_id,
  nombre: r.nombre,
  apellido: r.apellido,
  email: r.email,
  telefono: r.telefono,
  rol: r.rol,
  cargo: r.cargo,
  superAdmin: r.super_admin,
  activo: r.activo,
});

export type ApoderadoConNinos = {
  id: number;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  ninos: { id: number; nombreCompleto: string; sala: string; parentesco: string }[];
};

// Lista de apoderados del centro con todos sus niños — para reporte PDF.
export async function listApoderadosConNinos(
  db: PGlite,
  centroId: number,
): Promise<ApoderadoConNinos[]> {
  type Row = {
    apoderado_id: number;
    apoderado_nombre: string;
    apoderado_apellido: string;
    email: string | null;
    telefono: string | null;
    parentesco: string;
    nino_id: number;
    nino_nombre: string;
    nino_apellido: string;
    sala_nombre: string;
  };
  const result = await db.query<Row>(
    `
    SELECT u.id AS apoderado_id, u.nombre AS apoderado_nombre, u.apellido AS apoderado_apellido,
           u.email, u.telefono, na.parentesco,
           n.id AS nino_id, n.nombre AS nino_nombre, n.apellido AS nino_apellido,
           s.nombre AS sala_nombre
      FROM usuarios u
      JOIN nino_apoderado na ON na.apoderado_id = u.id
      JOIN ninos n ON n.id = na.nino_id
      JOIN salas s ON s.id = n.sala_id
     WHERE u.rol = 'apoderado'
       AND u.activo = true
       AND n.centro_id = $1
       AND n.activo = true
     ORDER BY u.apellido, u.nombre, n.apellido
    `,
    [centroId],
  );

  const byApoderado = new Map<number, ApoderadoConNinos>();
  for (const r of result.rows) {
    let a = byApoderado.get(r.apoderado_id);
    if (!a) {
      a = {
        id: r.apoderado_id,
        nombre: r.apoderado_nombre,
        apellido: r.apoderado_apellido,
        email: r.email,
        telefono: r.telefono,
        ninos: [],
      };
      byApoderado.set(r.apoderado_id, a);
    }
    a.ninos.push({
      id: r.nino_id,
      nombreCompleto: `${r.nino_nombre} ${r.nino_apellido}`,
      sala: r.sala_nombre,
      parentesco: r.parentesco,
    });
  }
  return Array.from(byApoderado.values());
}

// Lista de usuarios para el switcher de demo (todos los activos).
export async function listParaSwitcher(db: PGlite): Promise<Usuario[]> {
  const result = await db.query<UsuarioRow>(
    `SELECT * FROM usuarios WHERE activo = true
     ORDER BY
       CASE WHEN super_admin THEN 0
            WHEN rol = 'directora' THEN 1
            WHEN rol = 'docente' THEN 2
            ELSE 3
       END,
       apellido, nombre`,
  );
  return result.rows.map(mapUsuario);
}
