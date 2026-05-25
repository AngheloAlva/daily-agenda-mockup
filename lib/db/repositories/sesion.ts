// Repositorio de la sesión local. Una sola fila en la tabla `sesion`.

import type { PGlite } from "@electric-sql/pglite";
import type { SesionActiva, Usuario } from "../types";

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

const mapUsuario = (row: UsuarioRow): Usuario => ({
  id: row.id,
  centroId: row.centro_id,
  nombre: row.nombre,
  apellido: row.apellido,
  email: row.email,
  telefono: row.telefono,
  rol: row.rol,
  cargo: row.cargo,
  superAdmin: row.super_admin,
  activo: row.activo,
});

export async function getSesion(db: PGlite): Promise<SesionActiva | null> {
  const result = await db.query<{
    usuario_id: number;
    centro_activo_id: number | null;
  }>(`SELECT usuario_id, centro_activo_id FROM sesion WHERE id = 1`);
  const row = result.rows[0];
  return row
    ? { usuarioId: row.usuario_id, centroActivoId: row.centro_activo_id }
    : null;
}

export async function getUsuarioActivo(db: PGlite): Promise<Usuario | null> {
  const result = await db.query<UsuarioRow>(
    `SELECT u.* FROM usuarios u
     JOIN sesion s ON s.usuario_id = u.id
     WHERE s.id = 1`,
  );
  return result.rows[0] ? mapUsuario(result.rows[0]) : null;
}

export async function setCentroActivo(
  db: PGlite,
  centroId: number | null,
): Promise<void> {
  await db.query(
    `UPDATE sesion SET centro_activo_id = $1 WHERE id = 1`,
    [centroId],
  );
}

export async function setUsuarioActivo(
  db: PGlite,
  usuarioId: number,
): Promise<void> {
  await db.query(`UPDATE sesion SET usuario_id = $1 WHERE id = 1`, [usuarioId]);
}
