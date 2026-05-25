// Tipos de dominio en camelCase. Los repositorios mapean desde la columna SQL
// (snake_case) hacia estos tipos antes de devolverlos a los componentes.

export type Rol = "directora" | "docente" | "apoderado";
export type EstadoCuenta = "activo" | "pendiente";
export type EstadoAsistencia = "presente" | "ausente" | "atrasado" | "retirado";
export type TipoEvento = "reunion" | "actividad" | "celebracion" | "feriado";
export type TipoNotificacion =
  | "mensaje"
  | "asistencia"
  | "evento"
  | "informe"
  | "publicacion"
  | "sistema";

export type Centro = {
  id: number;
  nombre: string;
  codigo: string;
  servicio: string | null;
  direccion: string | null;
  comuna: string | null;
  colorTema: string | null;
  activo: boolean;
};

export type Usuario = {
  id: number;
  centroId: number | null;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  rol: Rol;
  cargo: string | null;
  superAdmin: boolean;
  activo: boolean;
};

export type Sala = {
  id: number;
  centroId: number;
  nombre: string;
  educadoraId: number | null;
  capacidad: number;
};

export type Nino = {
  id: number;
  centroId: number;
  nombre: string;
  apellido: string;
  salaId: number;
  salaNombre: string;
  fechaNacimiento: string; // YYYY-MM-DD
  rut: string | null;
  estadoCuenta: EstadoCuenta;
  fechaMatricula: string;
  activo: boolean;
};

export type NinoConApoderado = Nino & {
  apoderadoPrincipal: string | null; // nombre completo del apoderado principal
};

export type Notificacion = {
  id: number;
  usuarioId: number;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  link: string | null;
  entidadTipo: string | null;
  entidadId: number | null;
  leida: boolean;
  fecha: string;
};

export type SesionActiva = {
  usuarioId: number;
  centroActivoId: number | null;
};

export type Persona = {
  nombre: string;
  parentesco: string;
  telefono: string;
};

export type Entrevista = {
  id: number;
  fecha: string;
  titulo: string;
  realizada: boolean;
};

export type DocumentoFicha = {
  id: number;
  nombre: string;
  tipo: "pdf" | "doc" | "imagen";
  tamanoBytes: number | null;
  fecha: string;
};

export type FichaCompleta = {
  nino: {
    id: number;
    centroId: number;
    nombre: string;
    apellido: string;
    salaId: number;
    salaNombre: string;
    fechaNacimiento: string;
    rut: string | null;
    nacionalidad: string | null;
    direccion: string | null;
    comuna: string | null;
    grupoSanguineo: string | null;
    estadoCuenta: EstadoCuenta;
  };
  ficha: {
    prevision: string | null;
    alergias: string[];
    enfermedades: string[];
    seguroEscolar: boolean;
    dietaEspecial: string | null;
    viveCon: string | null;
    ocupacionMadre: string | null;
    ocupacionPadre: string | null;
    periodoAdaptacion: string | null;
    observaciones: string | null;
    convivencia: string | null;
  };
  autorizadosRetiro: Persona[];
  contactosEmergencia: Persona[];
  entrevistas: Entrevista[];
  documentos: DocumentoFicha[];
};

export type ConteoCuentas = {
  activos: number;
  pendientes: number;
};

/* ============ Mensajería ============ */

export type EstadoMensaje = "enviado" | "entregado" | "leido";
export type TipoMensajeContenido = "texto" | "interactivo";

export type ConversacionResumen = {
  id: number;
  asunto: string;
  esGrupo: boolean;
  fijado: boolean;
  fechaUltimo: string | null;
  preview: string | null;
  leido: boolean;
  participanteNombre: string;
  participanteRol: string;
  participanteIniciales: string;
};

export type MensajeDB = {
  id: number;
  conversacionId: number;
  autorId: number;
  autorNombre: string;
  autorIniciales: string;
  esMio: boolean;
  contenido: string;
  tipo: TipoMensajeContenido;
  botones: string[] | null;
  respuesta: string | null;
  estado: EstadoMensaje;
  fecha: string;
};

export type ConversacionDetalle = {
  id: number;
  asunto: string;
  esGrupo: boolean;
  fijado: boolean;
  participanteNombre: string;
  participanteRol: string;
  participanteIniciales: string;
  mensajes: MensajeDB[];
};

export type Borrador = {
  id: number;
  destinatario: string;
  asunto: string;
  contenido: string;
  preview: string;
  fecha: string;
};

export type ApoderadoLite = {
  id: number;
  nombre: string;
  apellido: string;
  iniciales: string;
};

/* ============ Asistencia ============ */

export type NinoConAsistencia = {
  id: number;
  nombre: string;
  apellido: string;
  salaId: number;
  salaNombre: string;
  apoderado: string | null;
  estado: EstadoAsistencia | null;
  horaLlegada: string | null;
  horaRetiro: string | null;
  retiradoPor: string | null;
};

export type ResumenDia = {
  total: number;
  presentes: number;
  ausentes: number;
  atrasados: number;
  sinRegistro: number;
};

export type AsistenciaDia = {
  fecha: string;
  dia: string; // "Lun", "Mar"...
  presentes: number;
  ausentes: number;
};

export type ProximoEvento = {
  id: number;
  titulo: string;
  fecha: string;
  fechaTexto: string;
};

export type Evento = {
  id: number;
  centroId: number;
  titulo: string;
  descripcion: string | null;
  fecha: string; // YYYY-MM-DD
  horaInicio: string | null; // HH:MM
  horaFin: string | null;
  tipo: TipoEvento;
  modalidad: "presencial" | "online" | null;
  ubicacion: string | null;
  alcanceSalaId: number | null;
  alcanceSalaNombre: string | null;
  recordatorio: boolean;
};

export type ActividadReciente = {
  id: number;
  tipo: "informe" | "mensaje" | "asistencia" | "evento";
  titulo: string;
  descripcion: string;
  fecha: string;
};

/* ============ Mural ============ */

export type AdjuntoPub = {
  id: number;
  nombre: string;
  tipo: "pdf" | "doc" | "imagen";
  tamano: string; // "1.3 MB"
};

export type PublicacionFeed = {
  id: number;
  autorNombre: string;
  autorRol: string;
  autorIniciales: string;
  titulo: string;
  contenido: string;
  fecha: string;
  destacado: boolean;
  likes: number;
  comentarios: number;
  yoLike: boolean;
  adjuntos: AdjuntoPub[];
};

export type DocumentoInstitucional = {
  id: number;
  titulo: string;
  descripcion: string | null;
  fechaActualizacion: string;
  tamano: string;
  tipo: "pdf" | "doc" | "imagen";
};

/* ============ Informes diarios ============ */

export type EstadoInforme = "pendiente" | "borrador" | "publicado";
export type EstadoAlimento = "completo" | "parcial" | "no_comio";
export type AnimoNino = "feliz" | "normal" | "triste";

export type Informe = {
  estado: EstadoInforme;
  desayuno: EstadoAlimento | null;
  almuerzo: EstadoAlimento | null;
  once: EstadoAlimento | null;
  siestaInicio: string | null;
  siestaFin: string | null;
  panalCambios: number | null;
  animo: AnimoNino | null;
  actividades: string | null;
  observaciones: string | null;
  fotoCargada: boolean;
};

export type NinoConInforme = {
  ninoId: number;
  nombre: string;
  apellido: string;
  salaId: number;
  salaNombre: string;
  informe: Informe;
};

export type ResumenInformes = {
  pendiente: number;
  borrador: number;
  publicado: number;
};

/* ============ Planificación curricular ============ */

export type AmbitoAprendizaje =
  | "desarrollo_personal_social"
  | "comunicacion_integral"
  | "interaccion_comprension_entorno";

export type EstadoPlanificacion = "borrador" | "aprobada" | "archivada";

export type Experiencia = {
  id: number;
  fecha: string;
  titulo: string;
  descripcion: string;
  materiales: string[];
  duracionMin: number | null;
  realizada: boolean;
  evaluacion: string | null;
};

export type PlanificacionResumen = {
  id: number;
  centroId: number;
  salaId: number;
  salaNombre: string;
  titulo: string;
  periodoInicio: string;
  periodoFin: string;
  ambito: AmbitoAprendizaje;
  objetivoGeneral: string;
  estado: EstadoPlanificacion;
  autorNombre: string;
  aprobadaPor: string | null;
  totalExperiencias: number;
  experienciasRealizadas: number;
};

export type PlanificacionDetalle = PlanificacionResumen & {
  experiencias: Experiencia[];
};

export type ResumenPlanificaciones = {
  total: number;
  borrador: number;
  aprobada: number;
  archivada: number;
};
