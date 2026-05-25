// Schema de la Agenda Digital (Semillitas del Oriente).
// Se ejecuta una sola vez al inicializar la base PGlite en el browser.

export const SCHEMA_SQL = /* sql */ `
-- ============ Tipos enumerados ============
CREATE TYPE rol_usuario AS ENUM ('directora', 'docente', 'apoderado');
CREATE TYPE estado_cuenta AS ENUM ('activo', 'pendiente');
CREATE TYPE estado_asistencia AS ENUM ('presente', 'ausente', 'atrasado', 'retirado');
CREATE TYPE estado_mensaje AS ENUM ('enviado', 'entregado', 'leido');
CREATE TYPE tipo_mensaje AS ENUM ('texto', 'interactivo');
CREATE TYPE tipo_evento AS ENUM ('reunion', 'actividad', 'celebracion', 'feriado');
CREATE TYPE tipo_adjunto AS ENUM ('pdf', 'doc', 'imagen');
CREATE TYPE entidad_adjunto AS ENUM ('publicacion', 'mensaje', 'nino', 'evento');
CREATE TYPE tipo_actividad AS ENUM ('informe', 'mensaje', 'asistencia', 'evento');
CREATE TYPE tipo_notificacion AS ENUM ('mensaje', 'asistencia', 'evento', 'informe', 'publicacion', 'sistema');
CREATE TYPE tipo_reporte AS ENUM (
  'asistencia_mensual', 'asistencia_semanal', 'informe_parvulo',
  'lista_apoderados', 'estado_cuentas', 'planificacion_mensual'
);
CREATE TYPE estado_alimento AS ENUM ('completo', 'parcial', 'no_comio');
CREATE TYPE animo_nino AS ENUM ('feliz', 'normal', 'triste');
CREATE TYPE estado_informe AS ENUM ('pendiente', 'borrador', 'publicado');
CREATE TYPE ambito_aprendizaje AS ENUM (
  'desarrollo_personal_social',
  'comunicacion_integral',
  'interaccion_comprension_entorno'
);
CREATE TYPE estado_planificacion AS ENUM ('borrador', 'aprobada', 'archivada');

-- ============ Centros (multi-jardín) ============
CREATE TABLE centros (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL,
  codigo      TEXT NOT NULL UNIQUE,
  servicio    TEXT,
  direccion   TEXT,
  comuna      TEXT,
  telefono    TEXT,
  logo_url    TEXT,
  color_tema  TEXT,
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ Usuarios ============
-- centro_id NULL + super_admin=true => rol regional SSMO (ve todos los centros)
CREATE TABLE usuarios (
  id          SERIAL PRIMARY KEY,
  centro_id   INT REFERENCES centros(id),
  nombre      TEXT NOT NULL,
  apellido    TEXT NOT NULL,
  email       TEXT UNIQUE,
  telefono    TEXT,
  rol         rol_usuario NOT NULL,
  cargo       TEXT,
  super_admin BOOLEAN NOT NULL DEFAULT false,
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ Salas ============
CREATE TABLE salas (
  id           SERIAL PRIMARY KEY,
  centro_id    INT NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  educadora_id INT REFERENCES usuarios(id),
  capacidad    INT NOT NULL,
  UNIQUE (centro_id, nombre)
);

-- ============ Niños ============
CREATE TABLE ninos (
  id                 SERIAL PRIMARY KEY,
  centro_id          INT NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  nombre             TEXT NOT NULL,
  apellido           TEXT NOT NULL,
  sala_id            INT NOT NULL REFERENCES salas(id),
  fecha_nacimiento   DATE NOT NULL,
  rut                TEXT,
  nacionalidad       TEXT DEFAULT 'Chilena',
  direccion          TEXT,
  comuna             TEXT,
  grupo_sanguineo    TEXT,
  estado_cuenta      estado_cuenta NOT NULL DEFAULT 'activo',
  fecha_matricula    DATE NOT NULL DEFAULT CURRENT_DATE,
  activo             BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX idx_ninos_centro ON ninos(centro_id);
CREATE INDEX idx_ninos_sala ON ninos(sala_id);

-- ============ Relación niño ↔ apoderado ============
CREATE TABLE nino_apoderado (
  nino_id       INT NOT NULL REFERENCES ninos(id) ON DELETE CASCADE,
  apoderado_id  INT NOT NULL REFERENCES usuarios(id),
  parentesco    TEXT NOT NULL,
  principal     BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (nino_id, apoderado_id)
);

-- ============ Ficha del párvulo ============
CREATE TABLE nino_ficha (
  nino_id              INT PRIMARY KEY REFERENCES ninos(id) ON DELETE CASCADE,
  prevision            TEXT,
  alergias             JSONB NOT NULL DEFAULT '[]'::jsonb,
  enfermedades         JSONB NOT NULL DEFAULT '[]'::jsonb,
  seguro_escolar       BOOLEAN NOT NULL DEFAULT true,
  dieta_especial       TEXT,
  vive_con             TEXT,
  ocupacion_madre      TEXT,
  ocupacion_padre      TEXT,
  periodo_adaptacion   TEXT,
  observaciones        TEXT,
  convivencia          TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE autorizados_retiro (
  id          SERIAL PRIMARY KEY,
  nino_id     INT NOT NULL REFERENCES ninos(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  parentesco  TEXT NOT NULL,
  telefono    TEXT NOT NULL,
  rut         TEXT
);

CREATE TABLE contactos_emergencia (
  id          SERIAL PRIMARY KEY,
  nino_id     INT NOT NULL REFERENCES ninos(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  parentesco  TEXT NOT NULL,
  telefono    TEXT NOT NULL,
  orden       INT NOT NULL DEFAULT 1
);

CREATE TABLE entrevistas (
  id        SERIAL PRIMARY KEY,
  nino_id   INT NOT NULL REFERENCES ninos(id) ON DELETE CASCADE,
  fecha     DATE NOT NULL,
  titulo    TEXT NOT NULL,
  realizada BOOLEAN NOT NULL DEFAULT false,
  notas     TEXT
);

-- ============ Asistencia (histórico) ============
CREATE TABLE asistencia (
  id             SERIAL PRIMARY KEY,
  nino_id        INT NOT NULL REFERENCES ninos(id) ON DELETE CASCADE,
  fecha          DATE NOT NULL,
  estado         estado_asistencia NOT NULL,
  hora_llegada   TIME,
  hora_retiro    TIME,
  retirado_por   TEXT,
  observacion    TEXT,
  registrado_por INT REFERENCES usuarios(id),
  UNIQUE (nino_id, fecha)
);
CREATE INDEX idx_asistencia_fecha ON asistencia(fecha);
CREATE INDEX idx_asistencia_nino ON asistencia(nino_id);

-- ============ Informes diarios ============
CREATE TABLE informes_diarios (
  id              SERIAL PRIMARY KEY,
  nino_id         INT NOT NULL REFERENCES ninos(id) ON DELETE CASCADE,
  fecha           DATE NOT NULL,
  estado          estado_informe NOT NULL DEFAULT 'borrador',
  desayuno        estado_alimento,
  almuerzo        estado_alimento,
  once            estado_alimento,
  siesta_inicio   TIME,
  siesta_fin      TIME,
  panal_cambios   INT,
  animo           animo_nino,
  actividades     TEXT,
  observaciones   TEXT,
  foto_cargada    BOOLEAN NOT NULL DEFAULT false,
  autor_id        INT NOT NULL REFERENCES usuarios(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (nino_id, fecha)
);
CREATE INDEX idx_informes_fecha ON informes_diarios(fecha);
CREATE INDEX idx_informes_estado ON informes_diarios(estado);

-- ============ Planificación curricular ============
CREATE TABLE planificaciones (
  id               SERIAL PRIMARY KEY,
  centro_id        INT NOT NULL REFERENCES centros(id),
  sala_id          INT NOT NULL REFERENCES salas(id),
  titulo           TEXT NOT NULL,
  periodo_inicio   DATE NOT NULL,
  periodo_fin      DATE NOT NULL,
  ambito           ambito_aprendizaje NOT NULL,
  objetivo_general TEXT NOT NULL,
  estado           estado_planificacion NOT NULL DEFAULT 'borrador',
  autor_id         INT NOT NULL REFERENCES usuarios(id),
  aprobada_por     INT REFERENCES usuarios(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE experiencias_aprendizaje (
  id               SERIAL PRIMARY KEY,
  planificacion_id INT NOT NULL REFERENCES planificaciones(id) ON DELETE CASCADE,
  fecha            DATE NOT NULL,
  titulo           TEXT NOT NULL,
  descripcion      TEXT NOT NULL,
  materiales       JSONB NOT NULL DEFAULT '[]'::jsonb,
  duracion_min     INT,
  realizada        BOOLEAN NOT NULL DEFAULT false,
  evaluacion       TEXT
);
CREATE INDEX idx_experiencias_fecha ON experiencias_aprendizaje(fecha);

-- ============ Mensajería ============
CREATE TABLE conversaciones (
  id          SERIAL PRIMARY KEY,
  asunto      TEXT NOT NULL,
  es_grupo    BOOLEAN NOT NULL DEFAULT false,
  fijado      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversacion_participantes (
  conversacion_id INT NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
  usuario_id      INT NOT NULL REFERENCES usuarios(id),
  ultima_lectura  TIMESTAMPTZ,
  PRIMARY KEY (conversacion_id, usuario_id)
);

CREATE TABLE mensajes (
  id              SERIAL PRIMARY KEY,
  conversacion_id INT NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
  autor_id        INT NOT NULL REFERENCES usuarios(id),
  contenido       TEXT NOT NULL,
  tipo            tipo_mensaje NOT NULL DEFAULT 'texto',
  botones         JSONB,
  respuesta       TEXT,
  estado          estado_mensaje NOT NULL DEFAULT 'enviado',
  fecha           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mensajes_conv ON mensajes(conversacion_id, fecha);

CREATE TABLE borradores_mensaje (
  id           SERIAL PRIMARY KEY,
  centro_id    INT NOT NULL REFERENCES centros(id),
  autor_id     INT NOT NULL REFERENCES usuarios(id),
  destinatario TEXT NOT NULL,
  asunto       TEXT NOT NULL,
  contenido    TEXT NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ Calendario ============
CREATE TABLE eventos (
  id              SERIAL PRIMARY KEY,
  centro_id       INT NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  descripcion     TEXT,
  fecha           DATE NOT NULL,
  hora_inicio     TIME,
  hora_fin        TIME,
  tipo            tipo_evento NOT NULL,
  modalidad       TEXT,
  ubicacion       TEXT,
  alcance_sala_id INT REFERENCES salas(id),
  recordatorio    BOOLEAN NOT NULL DEFAULT false,
  created_by      INT REFERENCES usuarios(id)
);
CREATE INDEX idx_eventos_fecha ON eventos(fecha);
CREATE INDEX idx_eventos_centro ON eventos(centro_id);

-- ============ Mural ============
CREATE TABLE publicaciones (
  id         SERIAL PRIMARY KEY,
  centro_id  INT NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  autor_id   INT NOT NULL REFERENCES usuarios(id),
  titulo     TEXT NOT NULL,
  contenido  TEXT NOT NULL,
  destacado  BOOLEAN NOT NULL DEFAULT false,
  fecha      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_publicaciones_centro ON publicaciones(centro_id, fecha DESC);

CREATE TABLE publicacion_likes (
  publicacion_id INT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  usuario_id     INT NOT NULL REFERENCES usuarios(id),
  fecha          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (publicacion_id, usuario_id)
);

CREATE TABLE comentarios (
  id             SERIAL PRIMARY KEY,
  publicacion_id INT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
  autor_id       INT NOT NULL REFERENCES usuarios(id),
  contenido      TEXT NOT NULL,
  fecha          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE adjuntos (
  id           SERIAL PRIMARY KEY,
  entidad      entidad_adjunto NOT NULL,
  entidad_id   INT NOT NULL,
  nombre       TEXT NOT NULL,
  tipo         tipo_adjunto NOT NULL,
  tamano_bytes BIGINT,
  url          TEXT,
  fecha        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_adjuntos_entidad ON adjuntos(entidad, entidad_id);

CREATE TABLE documentos_institucionales (
  id                  SERIAL PRIMARY KEY,
  centro_id           INT NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  titulo              TEXT NOT NULL,
  descripcion         TEXT,
  fecha_actualizacion DATE NOT NULL,
  tamano_bytes        BIGINT,
  tipo                tipo_adjunto NOT NULL,
  url                 TEXT
);

-- ============ Feed de actividad ============
CREATE TABLE actividades (
  id          SERIAL PRIMARY KEY,
  centro_id   INT NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  tipo        tipo_actividad NOT NULL,
  titulo      TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  usuario_id  INT REFERENCES usuarios(id),
  fecha       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_actividades_centro ON actividades(centro_id, fecha DESC);

-- ============ Notificaciones (push fake) ============
CREATE TABLE notificaciones (
  id           SERIAL PRIMARY KEY,
  usuario_id   INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo         tipo_notificacion NOT NULL,
  titulo       TEXT NOT NULL,
  cuerpo       TEXT NOT NULL,
  link         TEXT,
  entidad_tipo TEXT,
  entidad_id   INT,
  leida        BOOLEAN NOT NULL DEFAULT false,
  leida_at     TIMESTAMPTZ,
  fecha        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_usuario_no_leidas ON notificaciones(usuario_id, leida, fecha DESC);

-- ============ Historial de reportes generados ============
CREATE TABLE reportes_generados (
  id             SERIAL PRIMARY KEY,
  centro_id      INT NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  tipo           tipo_reporte NOT NULL,
  parametros     JSONB NOT NULL,
  generado_por   INT NOT NULL REFERENCES usuarios(id),
  fecha          TIMESTAMPTZ NOT NULL DEFAULT now(),
  archivo_nombre TEXT NOT NULL
);
CREATE INDEX idx_reportes_centro ON reportes_generados(centro_id, fecha DESC);

-- ============ Sesión local (una sola fila) ============
CREATE TABLE sesion (
  id               INT PRIMARY KEY DEFAULT 1,
  usuario_id       INT NOT NULL REFERENCES usuarios(id),
  centro_activo_id INT REFERENCES centros(id),
  CHECK (id = 1)
);
`;

// Versión del schema. Subir cuando se modifique para forzar re-seed en clientes con DB previa.
export const SCHEMA_VERSION = 2;
