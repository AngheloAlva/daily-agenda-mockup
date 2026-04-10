// Datos ficticios centralizados para la maqueta
// No usar esto en producción — es solo para el demo

export type Rol = "directora" | "docente" | "apoderado";

export type Usuario = {
  nombre: string;
  rol: Rol;
  cargo: string;
  email: string;
  iniciales: string;
};

export const usuarioDemo: Usuario = {
  nombre: "Angélica Fica Masías",
  rol: "directora",
  cargo: "Jefa Centro Infantil",
  email: "afica@ssmoriente.cl",
  iniciales: "AF",
};

export type Sala = {
  id: number;
  nombre: string;
  educadora: string;
  capacidad: number;
};

export const salas: Sala[] = [
  { id: 1, nombre: "Sala Cuna Mayor", educadora: "María González", capacidad: 20 },
  { id: 2, nombre: "Medio Menor", educadora: "Claudia Ramírez", capacidad: 25 },
  { id: 3, nombre: "Medio Mayor", educadora: "Patricia Núñez", capacidad: 25 },
];

export type EstadoAsistencia = "presente" | "ausente" | "atrasado";
export type EstadoCuenta = "activo" | "pendiente";

export type Nino = {
  id: number;
  nombre: string;
  apellido: string;
  sala: string;
  fechaNacimiento: string;
  apoderado: string;
  estadoHoy: EstadoAsistencia;
  estadoCuenta: EstadoCuenta;
};

export const ninos: Nino[] = [
  // Sala Cuna Mayor
  { id: 1, nombre: "Sofía", apellido: "Muñoz Vera", sala: "Sala Cuna Mayor", fechaNacimiento: "2024-03-15", apoderado: "Carolina Vera", estadoHoy: "presente", estadoCuenta: "activo" },
  { id: 2, nombre: "Matías", apellido: "Rojas Díaz", sala: "Sala Cuna Mayor", fechaNacimiento: "2024-06-22", apoderado: "Andrea Díaz", estadoHoy: "presente", estadoCuenta: "activo" },
  { id: 3, nombre: "Isidora", apellido: "Pérez Soto", sala: "Sala Cuna Mayor", fechaNacimiento: "2024-01-10", apoderado: "Camila Soto", estadoHoy: "ausente", estadoCuenta: "pendiente" },
  { id: 4, nombre: "Lucas", apellido: "Contreras Bravo", sala: "Sala Cuna Mayor", fechaNacimiento: "2024-05-08", apoderado: "Constanza Bravo", estadoHoy: "presente", estadoCuenta: "activo" },
  { id: 5, nombre: "Antonia", apellido: "Salinas Muñoz", sala: "Sala Cuna Mayor", fechaNacimiento: "2024-02-27", apoderado: "Macarena Muñoz", estadoHoy: "presente", estadoCuenta: "activo" },
  // Medio Menor
  { id: 6, nombre: "Tomás", apellido: "Silva Araya", sala: "Medio Menor", fechaNacimiento: "2023-09-05", apoderado: "Francisca Araya", estadoHoy: "atrasado", estadoCuenta: "activo" },
  { id: 7, nombre: "Valentina", apellido: "López Reyes", sala: "Medio Menor", fechaNacimiento: "2023-11-18", apoderado: "Javiera Reyes", estadoHoy: "presente", estadoCuenta: "activo" },
  { id: 8, nombre: "Benjamín", apellido: "Castro Fuentes", sala: "Medio Menor", fechaNacimiento: "2023-07-30", apoderado: "Paula Fuentes", estadoHoy: "presente", estadoCuenta: "activo" },
  { id: 9, nombre: "Catalina", apellido: "Navarro Pino", sala: "Medio Menor", fechaNacimiento: "2023-08-14", apoderado: "Romina Pino", estadoHoy: "presente", estadoCuenta: "pendiente" },
  { id: 10, nombre: "Joaquín", apellido: "Vargas Riquelme", sala: "Medio Menor", fechaNacimiento: "2023-10-02", apoderado: "Fernanda Riquelme", estadoHoy: "ausente", estadoCuenta: "activo" },
  // Medio Mayor
  { id: 11, nombre: "Emilia", apellido: "Martínez Herrera", sala: "Medio Mayor", fechaNacimiento: "2023-02-14", apoderado: "Daniela Herrera", estadoHoy: "presente", estadoCuenta: "activo" },
  { id: 12, nombre: "Agustín", apellido: "Fernández Morales", sala: "Medio Mayor", fechaNacimiento: "2023-04-25", apoderado: "Valentina Morales", estadoHoy: "ausente", estadoCuenta: "activo" },
  { id: 13, nombre: "Florencia", apellido: "Ortega Soto", sala: "Medio Mayor", fechaNacimiento: "2023-03-11", apoderado: "Camila Soto", estadoHoy: "presente", estadoCuenta: "activo" },
  { id: 14, nombre: "Maximiliano", apellido: "Guzmán Rivas", sala: "Medio Mayor", fechaNacimiento: "2023-05-19", apoderado: "Natalia Rivas", estadoHoy: "atrasado", estadoCuenta: "pendiente" },
  { id: 15, nombre: "Amanda", apellido: "Tapia Donoso", sala: "Medio Mayor", fechaNacimiento: "2023-01-29", apoderado: "Antonia Donoso", estadoHoy: "presente", estadoCuenta: "activo" },
];

// Calcula la edad en años y meses a partir de una fecha de nacimiento
export const calcularEdad = (
  fechaNacimiento: string,
  hoy: Date = new Date(),
): { anios: number; meses: number; texto: string } => {
  const nac = new Date(fechaNacimiento);
  let anios = hoy.getFullYear() - nac.getFullYear();
  let meses = hoy.getMonth() - nac.getMonth();
  if (hoy.getDate() < nac.getDate()) meses -= 1;
  if (meses < 0) {
    anios -= 1;
    meses += 12;
  }
  const texto =
    anios === 0
      ? `${meses} ${meses === 1 ? "mes" : "meses"}`
      : meses === 0
        ? `${anios} ${anios === 1 ? "año" : "años"}`
        : `${anios} ${anios === 1 ? "año" : "años"} ${meses} m`;
  return { anios, meses, texto };
};

// Días hasta el próximo cumpleaños
export const diasHastaCumple = (
  fechaNacimiento: string,
  hoy: Date = new Date(),
): number => {
  const nac = new Date(fechaNacimiento);
  const proximo = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate());
  if (proximo < hoy) proximo.setFullYear(hoy.getFullYear() + 1);
  const diff = proximo.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const inicialesDe = (nombre: string, apellido: string) =>
  `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase();

/* ---------- Mensajes ---------- */

export type EstadoMensaje = "enviado" | "entregado" | "leido";
export type TipoMensaje = "texto" | "interactivo";

export type Mensaje = {
  id: number;
  autorId: "yo" | string;
  autorNombre: string;
  contenido: string;
  fecha: string; // ISO
  estado: EstadoMensaje;
  tipo: TipoMensaje;
  botones?: string[];
  respuestaSeleccionada?: string;
};

export type Conversacion = {
  id: number;
  asunto: string;
  participanteNombre: string;
  participanteRol: string;
  participanteIniciales: string;
  esGrupo: boolean;
  leido: boolean;
  fijado?: boolean;
  fecha: string; // ISO
  preview: string;
  mensajes: Mensaje[];
};

export const conversaciones: Conversacion[] = [
  {
    id: 1,
    asunto: "Informe diario de Sofía",
    participanteNombre: "María González",
    participanteRol: "Educadora · Sala Cuna Mayor",
    participanteIniciales: "MG",
    esGrupo: false,
    leido: false,
    fecha: "2026-04-10T14:30:00",
    preview:
      "Hoy Sofía tuvo un excelente día. Durmió bien la siesta y comió todo…",
    mensajes: [
      {
        id: 1,
        autorId: "mg",
        autorNombre: "María González",
        contenido:
          "Estimada Angélica, adjunto el informe diario de Sofía. Tuvo un excelente día: durmió bien la siesta de la mañana, comió toda su colación y participó en la actividad de motricidad fina con mucho entusiasmo.",
        fecha: "2026-04-10T14:25:00",
        estado: "entregado",
        tipo: "texto",
      },
      {
        id: 2,
        autorId: "mg",
        autorNombre: "María González",
        contenido:
          "También quería comentarte que ya está respondiendo a su nombre con mayor frecuencia. ¡Un avance muy bonito de la semana!",
        fecha: "2026-04-10T14:30:00",
        estado: "entregado",
        tipo: "texto",
      },
    ],
  },
  {
    id: 2,
    asunto: "Reunión de apoderados — Mayo",
    participanteNombre: "Dirección",
    participanteRol: "Comunicado institucional",
    participanteIniciales: "DI",
    esGrupo: true,
    leido: true,
    fijado: true,
    fecha: "2026-04-09T09:00:00",
    preview:
      "Estimados apoderados, les informamos que la próxima reunión se…",
    mensajes: [
      {
        id: 1,
        autorId: "dir",
        autorNombre: "Dirección",
        contenido:
          "Estimados apoderados, les informamos que la próxima reunión general se realizará el jueves 15 de mayo a las 18:30 en el salón principal del centro infantil. Se tratarán temas importantes relacionados con el plan educativo 2026. Por favor confirmen su asistencia.",
        fecha: "2026-04-09T09:00:00",
        estado: "leido",
        tipo: "interactivo",
        botones: ["Confirmo asistencia", "No podré asistir"],
        respuestaSeleccionada: "Confirmo asistencia",
      },
    ],
  },
  {
    id: 3,
    asunto: "Consulta sobre alimentación",
    participanteNombre: "Carolina Vera",
    participanteRol: "Apoderada · Sofía Muñoz",
    participanteIniciales: "CV",
    esGrupo: false,
    leido: false,
    fecha: "2026-04-10T11:15:00",
    preview:
      "Hola, quería consultar si podrían considerar una alternativa para…",
    mensajes: [
      {
        id: 1,
        autorId: "cv",
        autorNombre: "Carolina Vera",
        contenido:
          "Hola, buen día. Quería consultar si podrían considerar una alternativa para la colación de Sofía los días miércoles. Comentamos con el pediatra que está probando nuevos alimentos y nos recomendó evitar los lácteos por ahora. ¿Sería posible coordinarlo con la educadora?",
        fecha: "2026-04-10T11:15:00",
        estado: "entregado",
        tipo: "texto",
      },
    ],
  },
  {
    id: 4,
    asunto: "Planificación mensual Medio Menor",
    participanteNombre: "Claudia Ramírez",
    participanteRol: "Educadora · Medio Menor",
    participanteIniciales: "CR",
    esGrupo: false,
    leido: true,
    fecha: "2026-04-08T16:40:00",
    preview:
      "Te dejo el borrador de la planificación del mes con las nuevas…",
    mensajes: [
      {
        id: 1,
        autorId: "cr",
        autorNombre: "Claudia Ramírez",
        contenido:
          "Te dejo el borrador de la planificación del mes con las nuevas experiencias de aprendizaje. Agregué dos salidas a la biblioteca comunal y una visita guiada al huerto escolar.",
        fecha: "2026-04-08T16:35:00",
        estado: "leido",
        tipo: "texto",
      },
      {
        id: 2,
        autorId: "yo",
        autorNombre: "Angélica Fica",
        contenido:
          "Perfecto Claudia, la reviso mañana y te confirmo cualquier ajuste. ¡Se ve muy completa!",
        fecha: "2026-04-08T16:40:00",
        estado: "leido",
        tipo: "texto",
      },
    ],
  },
  {
    id: 5,
    asunto: "Autorización salida educativa",
    participanteNombre: "Dirección",
    participanteRol: "Comunicado institucional",
    participanteIniciales: "DI",
    esGrupo: true,
    leido: true,
    fecha: "2026-04-07T10:20:00",
    preview:
      "Solicitamos autorización para la salida educativa al Parque…",
    mensajes: [
      {
        id: 1,
        autorId: "dir",
        autorNombre: "Dirección",
        contenido:
          "Estimados apoderados, solicitamos su autorización para la salida educativa al Parque Metropolitano el día viernes 25 de abril. La actividad está coordinada con la Corporación Parquemet y cuenta con transporte y colación incluida.",
        fecha: "2026-04-07T10:20:00",
        estado: "leido",
        tipo: "interactivo",
        botones: ["Autorizo", "No autorizo"],
      },
    ],
  },
  {
    id: 6,
    asunto: "Comunicado general — Protocolo COVID",
    participanteNombre: "Dirección",
    participanteRol: "Comunicado institucional",
    participanteIniciales: "DI",
    esGrupo: true,
    leido: true,
    fecha: "2026-04-05T08:00:00",
    preview:
      "Les recordamos las medidas sanitarias vigentes para el ingreso al…",
    mensajes: [
      {
        id: 1,
        autorId: "dir",
        autorNombre: "Dirección",
        contenido:
          "Les recordamos las medidas sanitarias vigentes para el ingreso al centro: control de temperatura, uso de alcohol gel y lavado de manos al ingresar. Agradecemos su colaboración.",
        fecha: "2026-04-05T08:00:00",
        estado: "leido",
        tipo: "texto",
      },
    ],
  },
];

/* ---------- Ficha del Párvulo ---------- */

export type FichaDetalle = {
  // Datos personales
  direccion: string;
  comuna: string;
  nacionalidad: string;
  grupoSanguineo: string;
  rut: string;
  // Salud
  prevision: string;
  alergias: string[];
  enfermedades: string[];
  seguroEscolar: boolean;
  dietaEspecial?: string;
  // Familia
  viveCon: string;
  autorizadosRetiro: { nombre: string; parentesco: string; telefono: string }[];
  contactosEmergencia: { nombre: string; parentesco: string; telefono: string }[];
  ocupacionMadre: string;
  ocupacionPadre: string;
  // Educación
  periodoAdaptacion: string;
  observaciones: string;
  convivencia: string;
  // Documentos
  documentos: { nombre: string; fecha: string; tipo: "pdf" | "doc" | "img" }[];
  entrevistas: { fecha: string; titulo: string; realizada: boolean }[];
};

// Detalle por defecto — se combina con overrides específicos por id
const fichaDefault: FichaDetalle = {
  direccion: "Av. Los Leones 1234, Dpto. 502",
  comuna: "Providencia",
  nacionalidad: "Chilena",
  grupoSanguineo: "O+",
  rut: "26.123.456-7",
  prevision: "Fonasa B",
  alergias: [],
  enfermedades: [],
  seguroEscolar: true,
  viveCon: "Ambos padres",
  autorizadosRetiro: [
    { nombre: "Carolina Vera", parentesco: "Madre", telefono: "+56 9 8765 4321" },
    { nombre: "Roberto Muñoz", parentesco: "Padre", telefono: "+56 9 8123 4567" },
  ],
  contactosEmergencia: [
    { nombre: "Patricia Vera", parentesco: "Abuela materna", telefono: "+56 9 7654 3210" },
  ],
  ocupacionMadre: "Enfermera · Hospital del Salvador",
  ocupacionPadre: "Ingeniero civil",
  periodoAdaptacion: "Completado exitosamente en marzo 2026",
  observaciones:
    "Niño/a social y cariñoso/a. Se adapta bien a las rutinas y disfruta de las actividades grupales.",
  convivencia:
    "Excelente relación con pares. Comparte materiales sin dificultad.",
  documentos: [
    { nombre: "Certificado de nacimiento.pdf", fecha: "2026-03-01", tipo: "pdf" },
    { nombre: "Ficha de salud 2026.pdf", fecha: "2026-03-05", tipo: "pdf" },
    { nombre: "Autorización de imágenes.pdf", fecha: "2026-03-10", tipo: "pdf" },
  ],
  entrevistas: [
    { fecha: "2026-03-12", titulo: "Entrevista inicial de adaptación", realizada: true },
    { fecha: "2026-05-20", titulo: "Seguimiento primer trimestre", realizada: false },
  ],
};

// Overrides específicos por párvulo
const fichasOverrides: Record<number, Partial<FichaDetalle>> = {
  1: {
    // Sofía Muñoz Vera
    alergias: ["Lácteos (lactosa)"],
    dietaEspecial: "Sin lácteos los miércoles por recomendación pediátrica",
    autorizadosRetiro: [
      { nombre: "Carolina Vera", parentesco: "Madre", telefono: "+56 9 8765 4321" },
      { nombre: "Roberto Muñoz", parentesco: "Padre", telefono: "+56 9 8123 4567" },
      { nombre: "Patricia Vera", parentesco: "Abuela materna", telefono: "+56 9 7654 3210" },
    ],
    observaciones:
      "Sofía es una niña muy sociable. Ha respondido muy bien al periodo de adaptación. Está empezando a responder a su nombre de manera consistente.",
  },
  3: {
    // Isidora Pérez Soto
    prevision: "Isapre Colmena",
    enfermedades: ["Asma leve"],
    dietaEspecial: "Evitar lácteos en exceso",
  },
  6: {
    // Tomás Silva Araya
    alergias: ["Maní", "Nueces"],
    observaciones:
      "Tomás requiere supervisión constante en horarios de alimentación por su alergia a frutos secos.",
  },
  11: {
    // Emilia Martínez Herrera
    prevision: "Isapre Banmédica",
    ocupacionMadre: "Doctora · CESFAM Provicencia",
  },
};

export const obtenerFicha = (ninoId: number): FichaDetalle => ({
  ...fichaDefault,
  ...(fichasOverrides[ninoId] ?? {}),
});

/* ---------- Calendario ---------- */

export type TipoEvento = "reunion" | "actividad" | "celebracion" | "feriado";

export type Evento = {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string; // YYYY-MM-DD
  horaInicio?: string;
  horaFin?: string;
  tipo: TipoEvento;
  modalidad?: "presencial" | "online";
  ubicacion?: string;
  alcance: "general" | string; // "general" o nombre de sala
  recordatorio?: boolean;
};

export const tipoEventoConfig: Record<
  TipoEvento,
  { label: string; dot: string; bg: string; text: string; border: string; emoji: string }
> = {
  reunion: {
    label: "Reunión",
    dot: "bg-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-900",
    emoji: "🔵",
  },
  actividad: {
    label: "Actividad educativa",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-900",
    emoji: "🟢",
  },
  celebracion: {
    label: "Celebración",
    dot: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-900",
    emoji: "🟡",
  },
  feriado: {
    label: "Feriado",
    dot: "bg-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-900",
    emoji: "🔴",
  },
};

// Feriados chilenos 2026 (aproximados — algunos lunes más cercano)
const feriadosChile2026: Evento[] = [
  { id: 1001, titulo: "Año Nuevo", descripcion: "Feriado legal", fecha: "2026-01-01", tipo: "feriado", alcance: "general" },
  { id: 1002, titulo: "Viernes Santo", descripcion: "Feriado religioso", fecha: "2026-04-03", tipo: "feriado", alcance: "general" },
  { id: 1003, titulo: "Sábado Santo", descripcion: "Feriado religioso", fecha: "2026-04-04", tipo: "feriado", alcance: "general" },
  { id: 1004, titulo: "Día del Trabajador", descripcion: "Feriado legal", fecha: "2026-05-01", tipo: "feriado", alcance: "general" },
  { id: 1005, titulo: "Día de las Glorias Navales", descripcion: "Feriado legal", fecha: "2026-05-21", tipo: "feriado", alcance: "general" },
  { id: 1006, titulo: "Día Nacional de los Pueblos Indígenas", descripcion: "Feriado legal", fecha: "2026-06-20", tipo: "feriado", alcance: "general" },
  { id: 1007, titulo: "San Pedro y San Pablo", descripcion: "Feriado religioso", fecha: "2026-06-29", tipo: "feriado", alcance: "general" },
  { id: 1008, titulo: "Día de la Virgen del Carmen", descripcion: "Feriado religioso", fecha: "2026-07-16", tipo: "feriado", alcance: "general" },
  { id: 1009, titulo: "Asunción de la Virgen", descripcion: "Feriado religioso", fecha: "2026-08-15", tipo: "feriado", alcance: "general" },
  { id: 1010, titulo: "Fiestas Patrias", descripcion: "Independencia de Chile", fecha: "2026-09-18", tipo: "feriado", alcance: "general" },
  { id: 1011, titulo: "Glorias del Ejército", descripcion: "Feriado legal", fecha: "2026-09-19", tipo: "feriado", alcance: "general" },
  { id: 1012, titulo: "Encuentro de Dos Mundos", descripcion: "Feriado legal", fecha: "2026-10-12", tipo: "feriado", alcance: "general" },
  { id: 1013, titulo: "Día de las Iglesias Evangélicas", descripcion: "Feriado legal", fecha: "2026-10-31", tipo: "feriado", alcance: "general" },
  { id: 1014, titulo: "Día de Todos los Santos", descripcion: "Feriado religioso", fecha: "2026-11-01", tipo: "feriado", alcance: "general" },
  { id: 1015, titulo: "Inmaculada Concepción", descripcion: "Feriado religioso", fecha: "2026-12-08", tipo: "feriado", alcance: "general" },
  { id: 1016, titulo: "Navidad", descripcion: "Feriado religioso", fecha: "2026-12-25", tipo: "feriado", alcance: "general" },
];

// Eventos del centro infantil
const eventosCentro: Evento[] = [
  {
    id: 2001,
    titulo: "Reunión equipo docente",
    descripcion: "Revisión de planificación semanal y coordinación de actividades.",
    fecha: "2026-04-13",
    horaInicio: "08:30",
    horaFin: "09:30",
    tipo: "reunion",
    modalidad: "presencial",
    ubicacion: "Sala de reuniones",
    alcance: "general",
    recordatorio: true,
  },
  {
    id: 2002,
    titulo: "Reunión con Dirección SSMO",
    descripcion: "Revisión de indicadores trimestrales del centro.",
    fecha: "2026-04-17",
    horaInicio: "10:00",
    horaFin: "11:30",
    tipo: "reunion",
    modalidad: "online",
    alcance: "general",
    recordatorio: true,
  },
  {
    id: 2003,
    titulo: "Taller de motricidad fina",
    descripcion: "Actividad con plasticinas y material sensorial.",
    fecha: "2026-04-22",
    horaInicio: "10:30",
    horaFin: "11:30",
    tipo: "actividad",
    modalidad: "presencial",
    ubicacion: "Sala Cuna Mayor",
    alcance: "Sala Cuna Mayor",
  },
  {
    id: 2004,
    titulo: "Celebración Día del Libro",
    descripcion: "Cuentacuentos con apoderados invitados y feria del libro infantil.",
    fecha: "2026-04-23",
    horaInicio: "09:30",
    horaFin: "11:00",
    tipo: "celebracion",
    modalidad: "presencial",
    ubicacion: "Salón principal",
    alcance: "general",
  },
  {
    id: 2005,
    titulo: "Salida educativa: Parque Metropolitano",
    descripcion: "Visita guiada con la Corporación Parquemet. Transporte y colación incluidos.",
    fecha: "2026-04-25",
    horaInicio: "09:00",
    horaFin: "13:00",
    tipo: "actividad",
    modalidad: "presencial",
    ubicacion: "Parque Metropolitano",
    alcance: "general",
    recordatorio: true,
  },
  {
    id: 2006,
    titulo: "Salida al huerto comunitario",
    descripcion: "Experiencia de aprendizaje: siembra y cuidado de plantas.",
    fecha: "2026-05-08",
    horaInicio: "10:00",
    horaFin: "12:00",
    tipo: "actividad",
    modalidad: "presencial",
    ubicacion: "Huerto comunal Providencia",
    alcance: "Medio Menor",
  },
  {
    id: 2007,
    titulo: "Día de la Familia",
    descripcion: "Actividad conjunta con apoderados. Talleres, juegos y convivencia.",
    fecha: "2026-05-10",
    horaInicio: "10:00",
    horaFin: "13:00",
    tipo: "celebracion",
    modalidad: "presencial",
    ubicacion: "Centro Infantil",
    alcance: "general",
    recordatorio: true,
  },
  {
    id: 2008,
    titulo: "Reunión de apoderados",
    descripcion: "Reunión general: plan educativo 2026 y novedades del trimestre.",
    fecha: "2026-05-15",
    horaInicio: "18:30",
    horaFin: "20:00",
    tipo: "reunion",
    modalidad: "presencial",
    ubicacion: "Salón principal",
    alcance: "general",
    recordatorio: true,
  },
];

export const eventos: Evento[] = [...feriadosChile2026, ...eventosCentro];

/* ---------- Mural ---------- */

export type DocumentoInstitucional = {
  id: number;
  titulo: string;
  descripcion: string;
  fechaActualizacion: string;
  tamano: string;
  tipo: "pdf" | "doc";
};

export const documentosInstitucionales: DocumentoInstitucional[] = [
  {
    id: 1,
    titulo: "Reglamento Interno",
    descripcion: "Normas de convivencia y funcionamiento del centro infantil",
    fechaActualizacion: "2026-03-01",
    tamano: "842 KB",
    tipo: "pdf",
  },
  {
    id: 2,
    titulo: "Plan Educativo 2026",
    descripcion: "Lineamientos pedagógicos y objetivos del año en curso",
    fechaActualizacion: "2026-03-15",
    tamano: "1.3 MB",
    tipo: "pdf",
  },
  {
    id: 3,
    titulo: "Protocolo de Emergencia",
    descripcion: "Procedimientos ante sismos, incendios y situaciones de riesgo",
    fechaActualizacion: "2026-02-20",
    tamano: "567 KB",
    tipo: "pdf",
  },
];

export type Adjunto = {
  nombre: string;
  tipo: "pdf" | "imagen" | "doc";
  tamano: string;
};

export type Publicacion = {
  id: number;
  autorNombre: string;
  autorRol: string;
  autorIniciales: string;
  titulo: string;
  contenido: string;
  fecha: string; // ISO
  adjuntos?: Adjunto[];
  likes: number;
  comentarios: number;
  destacado?: boolean;
};

export const publicaciones: Publicacion[] = [
  {
    id: 1,
    autorNombre: "Angélica Fica",
    autorRol: "Jefa Centro Infantil",
    autorIniciales: "AF",
    titulo: "Bienvenida al nuevo período 2026",
    contenido:
      "Estimada comunidad educativa, les damos la bienvenida al año 2026. Este período viene con muchas novedades: nuevas actividades educativas, renovación del huerto escolar y una mejor coordinación con las familias a través de esta nueva agenda digital. Agradecemos su confianza y compromiso con el desarrollo integral de nuestros párvulos.",
    fecha: "2026-04-10T09:00:00",
    adjuntos: [
      { nombre: "Calendario-academico-2026.pdf", tipo: "pdf", tamano: "345 KB" },
    ],
    likes: 24,
    comentarios: 6,
    destacado: true,
  },
  {
    id: 2,
    autorNombre: "Angélica Fica",
    autorRol: "Jefa Centro Infantil",
    autorIniciales: "AF",
    titulo: "Salida educativa al Parque Metropolitano",
    contenido:
      "Informamos que el día viernes 25 de abril realizaremos una salida educativa al Parque Metropolitano para todos los niveles. La actividad está coordinada con Parquemet e incluye transporte y colación. Recuerden firmar la autorización que encontrarán en el módulo de mensajes antes del 22 de abril.",
    fecha: "2026-04-08T14:30:00",
    adjuntos: [
      { nombre: "Autorizacion-salida.pdf", tipo: "pdf", tamano: "128 KB" },
      { nombre: "Itinerario-salida.pdf", tipo: "pdf", tamano: "210 KB" },
    ],
    likes: 18,
    comentarios: 12,
  },
  {
    id: 3,
    autorNombre: "María González",
    autorRol: "Educadora · Sala Cuna Mayor",
    autorIniciales: "MG",
    titulo: "Taller de motricidad fina esta semana",
    contenido:
      "Esta semana comenzamos un ciclo de talleres de motricidad fina con plasticinas y material sensorial de texturas. Los niños están explorando con mucho entusiasmo. Compartiremos fotos del proceso en los informes diarios.",
    fecha: "2026-04-07T11:15:00",
    likes: 15,
    comentarios: 3,
  },
  {
    id: 4,
    autorNombre: "Angélica Fica",
    autorRol: "Jefa Centro Infantil",
    autorIniciales: "AF",
    titulo: "Recordatorio: jornada de vacunación",
    contenido:
      "Les recordamos que la próxima semana el CESFAM realizará la jornada de vacunación escolar. Por favor, traer el carnet de control sano al día. Cualquier consulta, contactar a dirección.",
    fecha: "2026-04-05T08:45:00",
    likes: 9,
    comentarios: 2,
  },
  {
    id: 5,
    autorNombre: "Claudia Ramírez",
    autorRol: "Educadora · Medio Menor",
    autorIniciales: "CR",
    titulo: "Fotos de nuestra visita al huerto",
    contenido:
      "Les compartimos algunas fotos de la visita al huerto comunitario de la semana pasada. Los niños aprendieron sobre siembra y cuidado de plantas. ¡Fue una experiencia maravillosa!",
    fecha: "2026-04-03T16:20:00",
    adjuntos: [
      { nombre: "huerto-01.jpg", tipo: "imagen", tamano: "2.1 MB" },
      { nombre: "huerto-02.jpg", tipo: "imagen", tamano: "1.8 MB" },
      { nombre: "huerto-03.jpg", tipo: "imagen", tamano: "2.4 MB" },
    ],
    likes: 32,
    comentarios: 8,
  },
];

export const borradores = [
  {
    id: 101,
    destinatario: "Todos los apoderados",
    asunto: "Actividad día de la familia",
    preview: "Queridos apoderados, los invitamos a nuestra celebración…",
    fecha: "2026-04-10T09:30:00",
  },
  {
    id: 102,
    destinatario: "Apoderados Medio Mayor",
    asunto: "Recordatorio materiales para taller de arte",
    preview: "Les recordamos traer los materiales solicitados para el…",
    fecha: "2026-04-09T17:20:00",
  },
];

// Resumen del día (derivable, pero precalculado para claridad del demo)
export const resumenHoy = {
  matriculados: 45,
  presentes: 38,
  ausentes: 5,
  atrasados: 2,
  mensajesSinLeer: 3,
  proximoEvento: {
    titulo: "Reunión de apoderados",
    fecha: "2026-05-15",
    fechaTexto: "15 de mayo",
  },
};

// Asistencia semanal para el gráfico (lunes a viernes)
export const asistenciaSemanal = [
  { dia: "Lun", presentes: 40, ausentes: 5 },
  { dia: "Mar", presentes: 42, ausentes: 3 },
  { dia: "Mié", presentes: 39, ausentes: 6 },
  { dia: "Jue", presentes: 41, ausentes: 4 },
  { dia: "Vie", presentes: 38, ausentes: 7 },
];

export type Actividad = {
  id: number;
  titulo: string;
  descripcion: string;
  hora: string;
  tipo: "informe" | "mensaje" | "asistencia" | "evento";
};

export const actividadesRecientes: Actividad[] = [
  {
    id: 1,
    titulo: "Informe diario publicado",
    descripcion: "María González publicó el informe de Sala Cuna Mayor",
    hora: "Hace 15 min",
    tipo: "informe",
  },
  {
    id: 2,
    titulo: "Nuevo mensaje de Dirección",
    descripcion: "Reunión de apoderados — confirmación de asistencia",
    hora: "Hace 1 hora",
    tipo: "mensaje",
  },
  {
    id: 3,
    titulo: "Asistencia registrada",
    descripcion: "Claudia Ramírez cerró la asistencia de Medio Menor",
    hora: "Hace 2 horas",
    tipo: "asistencia",
  },
  {
    id: 4,
    titulo: "Retiro anticipado",
    descripcion: "Tomás Silva retirado a las 14:30 por apoderado",
    hora: "Hace 3 horas",
    tipo: "evento",
  },
];
