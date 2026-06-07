// Seed inicial de la base PGlite.
// Reproduce el mock existente (Jardín Infantil Girasoles) + un segundo centro
// para mostrar la capacidad multi-jardín del demo.

import type { PGlite, Transaction } from "@electric-sql/pglite";

type Tx = Transaction | PGlite;

export async function seedDatabase(db: PGlite): Promise<void> {
  await db.transaction(async (tx) => {
    const { centroGirasoles, centroBrotitos } = await seedCentros(tx);
    const usuarios = await seedUsuarios(tx, { centroGirasoles, centroBrotitos });
    const salas = await seedSalas(tx, { centroGirasoles, centroBrotitos, usuarios });
    const ninos = await seedNinos(tx, { centroGirasoles, centroBrotitos, salas, usuarios });
    await seedFichas(tx, ninos);
    await seedAsistenciaHistorica(tx, ninos, usuarios);
    await seedInformesDiarios(tx, ninos, usuarios);
    await seedPlanificaciones(tx, { centroGirasoles, salas, usuarios });
    await seedMensajeria(tx, usuarios, ninos);
    await seedEventos(tx, { centroGirasoles, centroBrotitos, usuarios, salas });
    await seedMural(tx, { centroGirasoles, usuarios });
    await seedDocumentosInstitucionales(tx, { centroGirasoles, centroBrotitos });
    await seedActividades(tx, { centroGirasoles, usuarios });
    await seedNotificaciones(tx, usuarios);
    await seedSesion(tx, { usuarios, centroGirasoles });
  });
}

/* ============ Centros ============ */

async function seedCentros(tx: Tx) {
  const girasoles = await tx.query<{ id: number }>(
    `INSERT INTO centros (nombre, codigo, servicio, direccion, comuna, telefono, color_tema)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      "Jardín Infantil Girasoles",
      "girasoles",
      "Red Comunitaria de Jardines Infantiles",
      "Av. Salvador 364",
      "Providencia",
      "+56 2 2575 5000",
      "#10b981",
    ],
  );
  const brotitos = await tx.query<{ id: number }>(
    `INSERT INTO centros (nombre, codigo, servicio, direccion, comuna, telefono, color_tema)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      "Centro Infantil Brotitos del Maipo",
      "brotitos-maipo",
      "Red Comunitaria de Jardines Infantiles",
      "Av. Las Condes 8120",
      "Las Condes",
      "+56 2 2333 4400",
      "#0ea5e9",
    ],
  );
  return {
    centroGirasoles: girasoles.rows[0].id,
    centroBrotitos: brotitos.rows[0].id,
  };
}

/* ============ Usuarios ============ */

type UsuariosSeed = {
  // Regional / super admin
  directoraRegional: number;
  // Girasoles
  angelica: number;
  mariaGonzalez: number;
  claudiaRamirez: number;
  patriciaNunez: number;
  // Apoderados Girasoles (subset clave)
  carolinaVera: number;
  andreaDiaz: number;
  camilaSoto: number;
  constanzaBravo: number;
  macarenaMunoz: number;
  franciscaAraya: number;
  javieraReyes: number;
  paulaFuentes: number;
  rominaPino: number;
  fernandaRiquelme: number;
  danielaHerrera: number;
  valentinaMorales: number;
  nataliaRivas: number;
  antoniaDonoso: number;
  // Brotitos
  jefaBrotitos: number;
  educadoraBrotitos: number;
  apoderadoBrotitos1: number;
  apoderadoBrotitos2: number;
};

async function insertUsuario(
  tx: Tx,
  data: {
    centroId: number | null;
    nombre: string;
    apellido: string;
    email?: string;
    telefono?: string;
    rol: "directora" | "docente" | "apoderado";
    cargo?: string;
    superAdmin?: boolean;
  },
): Promise<number> {
  const r = await tx.query<{ id: number }>(
    `INSERT INTO usuarios (centro_id, nombre, apellido, email, telefono, rol, cargo, super_admin)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      data.centroId,
      data.nombre,
      data.apellido,
      data.email ?? null,
      data.telefono ?? null,
      data.rol,
      data.cargo ?? null,
      data.superAdmin ?? false,
    ],
  );
  return r.rows[0].id;
}

async function seedUsuarios(
  tx: Tx,
  { centroGirasoles, centroBrotitos }: { centroGirasoles: number; centroBrotitos: number },
): Promise<UsuariosSeed> {
  const directoraRegional = await insertUsuario(tx, {
    centroId: null,
    nombre: "Patricia",
    apellido: "Morales Carrasco",
    email: "pmorales@jigirasoles.cl",
    rol: "directora",
    cargo: "Coordinadora Regional de la Red",
    superAdmin: true,
  });

  // Girasoles
  const angelica = await insertUsuario(tx, {
    centroId: centroGirasoles,
    nombre: "Angélica",
    apellido: "Fica Masías",
    email: "afica@jigirasoles.cl",
    rol: "directora",
    cargo: "Jefa Centro Infantil",
  });
  const mariaGonzalez = await insertUsuario(tx, {
    centroId: centroGirasoles,
    nombre: "María",
    apellido: "González",
    email: "mgonzalez@jigirasoles.cl",
    rol: "docente",
    cargo: "Educadora · Sala Cuna Mayor",
  });
  const claudiaRamirez = await insertUsuario(tx, {
    centroId: centroGirasoles,
    nombre: "Claudia",
    apellido: "Ramírez",
    email: "cramirez@jigirasoles.cl",
    rol: "docente",
    cargo: "Educadora · Medio Menor",
  });
  const patriciaNunez = await insertUsuario(tx, {
    centroId: centroGirasoles,
    nombre: "Patricia",
    apellido: "Núñez",
    email: "pnunez@jigirasoles.cl",
    rol: "docente",
    cargo: "Educadora · Medio Mayor",
  });

  // Apoderados Girasoles
  const apod = async (nombre: string, apellido: string, telefono: string) =>
    insertUsuario(tx, {
      centroId: centroGirasoles,
      nombre,
      apellido,
      telefono,
      rol: "apoderado",
    });
  const carolinaVera = await apod("Carolina", "Vera", "+56 9 8765 4321");
  const andreaDiaz = await apod("Andrea", "Díaz", "+56 9 8765 1111");
  const camilaSoto = await apod("Camila", "Soto", "+56 9 8765 2222");
  const constanzaBravo = await apod("Constanza", "Bravo", "+56 9 8765 3333");
  const macarenaMunoz = await apod("Macarena", "Muñoz", "+56 9 8765 4444");
  const franciscaAraya = await apod("Francisca", "Araya", "+56 9 8765 5555");
  const javieraReyes = await apod("Javiera", "Reyes", "+56 9 8765 6666");
  const paulaFuentes = await apod("Paula", "Fuentes", "+56 9 8765 7777");
  const rominaPino = await apod("Romina", "Pino", "+56 9 8765 8888");
  const fernandaRiquelme = await apod("Fernanda", "Riquelme", "+56 9 8765 9999");
  const danielaHerrera = await apod("Daniela", "Herrera", "+56 9 8764 1111");
  const valentinaMorales = await apod("Valentina", "Morales", "+56 9 8764 2222");
  const nataliaRivas = await apod("Natalia", "Rivas", "+56 9 8764 3333");
  const antoniaDonoso = await apod("Antonia", "Donoso", "+56 9 8764 4444");

  // Brotitos
  const jefaBrotitos = await insertUsuario(tx, {
    centroId: centroBrotitos,
    nombre: "Verónica",
    apellido: "Salazar",
    email: "vsalazar@jigirasoles.cl",
    rol: "directora",
    cargo: "Jefa Centro Infantil",
  });
  const educadoraBrotitos = await insertUsuario(tx, {
    centroId: centroBrotitos,
    nombre: "Ximena",
    apellido: "Oyarzún",
    email: "xoyarzun@jigirasoles.cl",
    rol: "docente",
    cargo: "Educadora · Sala Cuna",
  });
  const apoderadoBrotitos1 = await insertUsuario(tx, {
    centroId: centroBrotitos,
    nombre: "Rocío",
    apellido: "Espinoza",
    telefono: "+56 9 7777 1111",
    rol: "apoderado",
  });
  const apoderadoBrotitos2 = await insertUsuario(tx, {
    centroId: centroBrotitos,
    nombre: "Cristián",
    apellido: "Pizarro",
    telefono: "+56 9 7777 2222",
    rol: "apoderado",
  });

  return {
    directoraRegional,
    angelica,
    mariaGonzalez,
    claudiaRamirez,
    patriciaNunez,
    carolinaVera,
    andreaDiaz,
    camilaSoto,
    constanzaBravo,
    macarenaMunoz,
    franciscaAraya,
    javieraReyes,
    paulaFuentes,
    rominaPino,
    fernandaRiquelme,
    danielaHerrera,
    valentinaMorales,
    nataliaRivas,
    antoniaDonoso,
    jefaBrotitos,
    educadoraBrotitos,
    apoderadoBrotitos1,
    apoderadoBrotitos2,
  };
}

/* ============ Salas ============ */

type SalasSeed = {
  salaCunaMayor: number;
  medioMenor: number;
  medioMayor: number;
  brotitosSalaCuna: number;
  brotitosMedio: number;
};

async function seedSalas(
  tx: Tx,
  {
    centroGirasoles,
    centroBrotitos,
    usuarios,
  }: {
    centroGirasoles: number;
    centroBrotitos: number;
    usuarios: UsuariosSeed;
  },
): Promise<SalasSeed> {
  const insert = async (
    centroId: number,
    nombre: string,
    educadoraId: number,
    capacidad: number,
  ) => {
    const r = await tx.query<{ id: number }>(
      `INSERT INTO salas (centro_id, nombre, educadora_id, capacidad)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [centroId, nombre, educadoraId, capacidad],
    );
    return r.rows[0].id;
  };

  return {
    salaCunaMayor: await insert(centroGirasoles, "Sala Cuna Mayor", usuarios.mariaGonzalez, 20),
    medioMenor: await insert(centroGirasoles, "Medio Menor", usuarios.claudiaRamirez, 25),
    medioMayor: await insert(centroGirasoles, "Medio Mayor", usuarios.patriciaNunez, 25),
    brotitosSalaCuna: await insert(centroBrotitos, "Sala Cuna", usuarios.educadoraBrotitos, 18),
    brotitosMedio: await insert(centroBrotitos, "Medio", usuarios.educadoraBrotitos, 22),
  };
}

/* ============ Niños ============ */

type NinoData = {
  id: number;
  centroId: number;
  salaId: number;
  apoderadoPrincipal: number;
  apoderadoSecundario?: number;
  fechaNacimiento: string;
  estadoCuenta: "activo" | "pendiente";
};

async function seedNinos(
  tx: Tx,
  {
    centroGirasoles,
    centroBrotitos,
    salas,
    usuarios,
  }: {
    centroGirasoles: number;
    centroBrotitos: number;
    salas: SalasSeed;
    usuarios: UsuariosSeed;
  },
): Promise<NinoData[]> {
  const insertNino = async (
    centroId: number,
    nombre: string,
    apellido: string,
    salaId: number,
    fechaNacimiento: string,
    estadoCuenta: "activo" | "pendiente",
  ) => {
    const r = await tx.query<{ id: number }>(
      `INSERT INTO ninos (centro_id, nombre, apellido, sala_id, fecha_nacimiento, estado_cuenta, fecha_matricula)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [centroId, nombre, apellido, salaId, fechaNacimiento, estadoCuenta, "2026-03-01"],
    );
    return r.rows[0].id;
  };

  const link = async (ninoId: number, apoderadoId: number, parentesco: string, principal: boolean) => {
    await tx.query(
      `INSERT INTO nino_apoderado (nino_id, apoderado_id, parentesco, principal)
       VALUES ($1, $2, $3, $4)`,
      [ninoId, apoderadoId, parentesco, principal],
    );
  };

  // Girasoles — 15 niños del mock original
  const definiciones: Array<{
    nombre: string;
    apellido: string;
    sala: number;
    fn: string;
    estado: "activo" | "pendiente";
    apod: number;
  }> = [
    { nombre: "Sofía", apellido: "Muñoz Vera", sala: salas.salaCunaMayor, fn: "2024-03-15", estado: "activo", apod: usuarios.carolinaVera },
    { nombre: "Matías", apellido: "Rojas Díaz", sala: salas.salaCunaMayor, fn: "2024-06-22", estado: "activo", apod: usuarios.andreaDiaz },
    { nombre: "Isidora", apellido: "Pérez Soto", sala: salas.salaCunaMayor, fn: "2024-01-10", estado: "pendiente", apod: usuarios.camilaSoto },
    { nombre: "Lucas", apellido: "Contreras Bravo", sala: salas.salaCunaMayor, fn: "2024-05-08", estado: "activo", apod: usuarios.constanzaBravo },
    { nombre: "Antonia", apellido: "Salinas Muñoz", sala: salas.salaCunaMayor, fn: "2024-02-27", estado: "activo", apod: usuarios.macarenaMunoz },
    { nombre: "Tomás", apellido: "Silva Araya", sala: salas.medioMenor, fn: "2023-09-05", estado: "activo", apod: usuarios.franciscaAraya },
    { nombre: "Valentina", apellido: "López Reyes", sala: salas.medioMenor, fn: "2023-11-18", estado: "activo", apod: usuarios.javieraReyes },
    { nombre: "Benjamín", apellido: "Castro Fuentes", sala: salas.medioMenor, fn: "2023-07-30", estado: "activo", apod: usuarios.paulaFuentes },
    { nombre: "Catalina", apellido: "Navarro Pino", sala: salas.medioMenor, fn: "2023-08-14", estado: "pendiente", apod: usuarios.rominaPino },
    { nombre: "Joaquín", apellido: "Vargas Riquelme", sala: salas.medioMenor, fn: "2023-10-02", estado: "activo", apod: usuarios.fernandaRiquelme },
    { nombre: "Emilia", apellido: "Martínez Herrera", sala: salas.medioMayor, fn: "2023-02-14", estado: "activo", apod: usuarios.danielaHerrera },
    { nombre: "Agustín", apellido: "Fernández Morales", sala: salas.medioMayor, fn: "2023-04-25", estado: "activo", apod: usuarios.valentinaMorales },
    // Florencia comparte mamá (Camila Soto) con Isidora — caso real de hermanos
    { nombre: "Florencia", apellido: "Ortega Soto", sala: salas.medioMayor, fn: "2023-03-11", estado: "activo", apod: usuarios.camilaSoto },
    { nombre: "Maximiliano", apellido: "Guzmán Rivas", sala: salas.medioMayor, fn: "2023-05-19", estado: "pendiente", apod: usuarios.nataliaRivas },
    { nombre: "Amanda", apellido: "Tapia Donoso", sala: salas.medioMayor, fn: "2023-01-29", estado: "activo", apod: usuarios.antoniaDonoso },
  ];

  const ninos: NinoData[] = [];
  for (const d of definiciones) {
    const id = await insertNino(centroGirasoles, d.nombre, d.apellido, d.sala, d.fn, d.estado);
    await link(id, d.apod, "Madre", true);
    ninos.push({
      id,
      centroId: centroGirasoles,
      salaId: d.sala,
      apoderadoPrincipal: d.apod,
      fechaNacimiento: d.fn,
      estadoCuenta: d.estado,
    });
  }

  // Brotitos del Maipo — 4 niños para que el segundo centro tenga vida
  const brotitosDefs: Array<{
    nombre: string;
    apellido: string;
    sala: number;
    fn: string;
    apod: number;
  }> = [
    { nombre: "Vicente", apellido: "Espinoza Tapia", sala: salas.brotitosSalaCuna, fn: "2024-04-12", apod: usuarios.apoderadoBrotitos1 },
    { nombre: "Renata", apellido: "Pizarro Lagos", sala: salas.brotitosSalaCuna, fn: "2024-02-08", apod: usuarios.apoderadoBrotitos2 },
    { nombre: "Bruno", apellido: "Espinoza Tapia", sala: salas.brotitosMedio, fn: "2023-06-15", apod: usuarios.apoderadoBrotitos1 },
    { nombre: "Olivia", apellido: "Pizarro Lagos", sala: salas.brotitosMedio, fn: "2023-08-22", apod: usuarios.apoderadoBrotitos2 },
  ];
  for (const d of brotitosDefs) {
    const id = await insertNino(centroBrotitos, d.nombre, d.apellido, d.sala, d.fn, "activo");
    await link(id, d.apod, "Madre", true);
    ninos.push({
      id,
      centroId: centroBrotitos,
      salaId: d.sala,
      apoderadoPrincipal: d.apod,
      fechaNacimiento: d.fn,
      estadoCuenta: "activo",
    });
  }

  return ninos;
}

/* ============ Fichas, autorizados, contactos ============ */

async function seedFichas(tx: Tx, ninos: NinoData[]): Promise<void> {
  for (const nino of ninos) {
    // Ficha base con algunos overrides por id de orden (mantienen el espíritu del mock)
    const esIsidora = nino.id === 3;
    const esTomas = nino.id === 6;
    const esEmilia = nino.id === 11;
    const esSofia = nino.id === 1;

    const alergias = esSofia
      ? ["Lácteos (lactosa)"]
      : esTomas
        ? ["Maní", "Nueces"]
        : [];
    const enfermedades = esIsidora ? ["Asma leve"] : [];
    const prevision = esIsidora ? "Isapre Colmena" : esEmilia ? "Isapre Banmédica" : "Fonasa B";
    const dietaEspecial = esSofia
      ? "Sin lácteos los miércoles por recomendación pediátrica"
      : esIsidora
        ? "Evitar lácteos en exceso"
        : null;
    const observaciones = esSofia
      ? "Sofía es una niña muy sociable. Ha respondido muy bien al periodo de adaptación."
      : esTomas
        ? "Tomás requiere supervisión constante en horarios de alimentación por su alergia a frutos secos."
        : "Niño/a social y cariñoso/a. Se adapta bien a las rutinas y disfruta de las actividades grupales.";
    const ocupacionMadre = esEmilia ? "Doctora · CESFAM Providencia" : "Enfermera · Hospital del Salvador";

    await tx.query(
      `INSERT INTO nino_ficha
        (nino_id, prevision, alergias, enfermedades, seguro_escolar, dieta_especial,
         vive_con, ocupacion_madre, ocupacion_padre, periodo_adaptacion, observaciones, convivencia)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        nino.id,
        prevision,
        JSON.stringify(alergias),
        JSON.stringify(enfermedades),
        true,
        dietaEspecial,
        "Ambos padres",
        ocupacionMadre,
        "Ingeniero civil",
        "Completado exitosamente en marzo 2026",
        observaciones,
        "Excelente relación con pares. Comparte materiales sin dificultad.",
      ],
    );

    // Autorizados de retiro
    await tx.query(
      `INSERT INTO autorizados_retiro (nino_id, nombre, parentesco, telefono)
       VALUES ($1, $2, $3, $4), ($1, $5, $6, $7)`,
      [
        nino.id,
        "Madre del niño/a",
        "Madre",
        "+56 9 8765 4321",
        "Padre del niño/a",
        "Padre",
        "+56 9 8123 4567",
      ],
    );

    // Contacto de emergencia
    await tx.query(
      `INSERT INTO contactos_emergencia (nino_id, nombre, parentesco, telefono, orden)
       VALUES ($1, $2, $3, $4, $5)`,
      [nino.id, "Patricia Vera", "Abuela materna", "+56 9 7654 3210", 1],
    );

    // Entrevistas
    await tx.query(
      `INSERT INTO entrevistas (nino_id, fecha, titulo, realizada)
       VALUES ($1, $2, $3, $4), ($1, $5, $6, $7)`,
      [
        nino.id,
        "2026-03-12",
        "Entrevista inicial de adaptación",
        true,
        "2026-05-20",
        "Seguimiento primer trimestre",
        false,
      ],
    );

    // Documentos adjuntos a la ficha del niño (polimórfico → adjuntos)
    await tx.query(
      `INSERT INTO adjuntos (entidad, entidad_id, nombre, tipo, tamano_bytes, fecha)
       VALUES
        ('nino', $1, 'Certificado de nacimiento.pdf', 'pdf', 245000, '2026-03-01'),
        ('nino', $1, 'Ficha de salud 2026.pdf', 'pdf', 380000, '2026-03-05'),
        ('nino', $1, 'Autorización de imágenes.pdf', 'pdf', 128000, '2026-03-10')`,
      [nino.id],
    );
  }
}

/* ============ Asistencia histórica (4 semanas hábiles previas) ============ */

async function seedAsistenciaHistorica(
  tx: Tx,
  ninos: NinoData[],
  usuarios: UsuariosSeed,
): Promise<void> {
  // Fecha "hoy" del demo: 2026-04-10 (viernes). Generamos 20 días hábiles previos.
  const hoy = new Date("2026-04-10T00:00:00");
  const fechas: string[] = [];
  const cursor = new Date(hoy);
  while (fechas.length < 20) {
    cursor.setDate(cursor.getDate() - 1);
    const dow = cursor.getDay();
    if (dow >= 1 && dow <= 5) {
      fechas.push(cursor.toISOString().slice(0, 10));
    }
  }
  fechas.push(hoy.toISOString().slice(0, 10));

  // Estados "hoy" del mock original — solo aplican a niños 1-15 (Girasoles)
  const estadosHoy: Record<number, "presente" | "ausente" | "atrasado"> = {
    1: "presente", 2: "presente", 3: "ausente", 4: "presente", 5: "presente",
    6: "atrasado", 7: "presente", 8: "presente", 9: "presente", 10: "ausente",
    11: "presente", 12: "ausente", 13: "presente", 14: "atrasado", 15: "presente",
  };

  // Determinismo: seed por nino_id + fecha para que el demo se vea igual entre resets
  const pseudoRandom = (ninoId: number, fechaIdx: number) => {
    const x = Math.sin(ninoId * 1000 + fechaIdx) * 10000;
    return x - Math.floor(x);
  };

  for (const nino of ninos) {
    for (let i = 0; i < fechas.length; i++) {
      const fecha = fechas[i];
      let estado: "presente" | "ausente" | "atrasado";
      let horaLlegada: string | null = null;
      let horaRetiro: string | null = null;

      if (fecha === hoy.toISOString().slice(0, 10) && estadosHoy[nino.id]) {
        estado = estadosHoy[nino.id];
      } else {
        const r = pseudoRandom(nino.id, i);
        if (r < 0.85) estado = "presente";
        else if (r < 0.95) estado = "ausente";
        else estado = "atrasado";
      }

      if (estado === "presente") {
        horaLlegada = "08:30:00";
        horaRetiro = "17:00:00";
      } else if (estado === "atrasado") {
        horaLlegada = "09:45:00";
        horaRetiro = "17:00:00";
      }

      await tx.query(
        `INSERT INTO asistencia (nino_id, fecha, estado, hora_llegada, hora_retiro, registrado_por)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [nino.id, fecha, estado, horaLlegada, horaRetiro, usuarios.mariaGonzalez],
      );
    }
  }
}

/* ============ Informes diarios (últimos 3 días para niños activos hoy) ============ */

async function seedInformesDiarios(
  tx: Tx,
  ninos: NinoData[],
  usuarios: UsuariosSeed,
): Promise<void> {
  const fechas = ["2026-04-08", "2026-04-09", "2026-04-10"];
  const animos = ["feliz", "normal", "triste"] as const;
  const estadosComida = ["completo", "parcial", "no_comio"] as const;
  const estadosInforme = ["publicado", "borrador", "pendiente"] as const;

  const educadorasPorSala = new Map<number, number>();
  // Mapeamos sala → educadora. Hard-coded por simplicidad del seed.
  // Niños 1-5 = Sala Cuna Mayor → María; 6-10 = Medio Menor → Claudia; 11-15 = Medio Mayor → Patricia
  for (const nino of ninos) {
    if (nino.id <= 5) educadorasPorSala.set(nino.id, usuarios.mariaGonzalez);
    else if (nino.id <= 10) educadorasPorSala.set(nino.id, usuarios.claudiaRamirez);
    else if (nino.id <= 15) educadorasPorSala.set(nino.id, usuarios.patriciaNunez);
    else educadorasPorSala.set(nino.id, usuarios.educadoraBrotitos);
  }

  const actividadesEjemplo = [
    "Trabajamos con plasticinas de colores. Exploración de texturas blandas.",
    "Lectura del libro 'El monstruo de colores' con apoyo de imágenes.",
    "Tiempo en el patio con pelotas suaves y juegos de motricidad gruesa.",
  ];

  for (let f = 0; f < fechas.length; f++) {
    const fecha = fechas[f];
    for (const nino of ninos) {
      // Solo niños presentes ese día (90% de probabilidad — esto es demo)
      const r = Math.sin(nino.id + f * 100) * 10000;
      const rand = r - Math.floor(r);
      if (rand < 0.1) continue;

      const animo = animos[Math.floor(rand * animos.length)];
      const desayuno = estadosComida[Math.floor(rand * 3)];
      const almuerzo = estadosComida[Math.floor((rand * 7) % 3)];
      const once = estadosComida[Math.floor((rand * 13) % 3)];
      const actividades = actividadesEjemplo[f % 3];
      // Para "hoy" (último día), mezcla de estados realistas.
      // Para días anteriores, todos publicados.
      const estado =
        f === fechas.length - 1
          ? estadosInforme[Math.floor(rand * 3)]
          : "publicado";

      await tx.query(
        `INSERT INTO informes_diarios
          (nino_id, fecha, estado, desayuno, almuerzo, once,
           siesta_inicio, siesta_fin, panal_cambios,
           animo, actividades, observaciones, foto_cargada, autor_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7::time, $8::time, $9, $10, $11, $12, $13, $14)`,
        [
          nino.id,
          fecha,
          estado,
          desayuno,
          almuerzo,
          once,
          "13:00",
          "14:30",
          nino.id <= 5 ? 3 : 1,
          animo,
          actividades,
          estado === "pendiente"
            ? null
            : "Día tranquilo, participó activamente en las experiencias propuestas.",
          rand > 0.5,
          educadorasPorSala.get(nino.id),
        ],
      );
    }
  }
}

/* ============ Planificaciones curriculares ============ */

async function seedPlanificaciones(
  tx: Tx,
  {
    centroGirasoles,
    salas,
    usuarios,
  }: {
    centroGirasoles: number;
    salas: SalasSeed;
    usuarios: UsuariosSeed;
  },
): Promise<void> {
  const planSalaCuna = await tx.query<{ id: number }>(
    `INSERT INTO planificaciones
      (centro_id, sala_id, titulo, periodo_inicio, periodo_fin, ambito, objetivo_general, estado, autor_id, aprobada_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [
      centroGirasoles,
      salas.salaCunaMayor,
      "Abril 2026 — Mi cuerpo y mis emociones",
      "2026-04-01",
      "2026-04-30",
      "desarrollo_personal_social",
      "Reconocer y expresar emociones básicas a través del juego sensorial y la exploración corporal.",
      "aprobada",
      usuarios.mariaGonzalez,
      usuarios.angelica,
    ],
  );

  const planMedioMenor = await tx.query<{ id: number }>(
    `INSERT INTO planificaciones
      (centro_id, sala_id, titulo, periodo_inicio, periodo_fin, ambito, objetivo_general, estado, autor_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      centroGirasoles,
      salas.medioMenor,
      "Abril 2026 — Exploramos el huerto",
      "2026-04-01",
      "2026-04-30",
      "interaccion_comprension_entorno",
      "Conocer el ciclo de las plantas a través de la siembra y cuidado en el huerto comunitario.",
      "borrador",
      usuarios.claudiaRamirez,
    ],
  );

  const exp = async (planId: number, fecha: string, titulo: string, descripcion: string, materiales: string[]) => {
    await tx.query(
      `INSERT INTO experiencias_aprendizaje
        (planificacion_id, fecha, titulo, descripcion, materiales, duracion_min)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
      [planId, fecha, titulo, descripcion, JSON.stringify(materiales), 45],
    );
  };

  await exp(planSalaCuna.rows[0].id, "2026-04-07", "Texturas y sensaciones",
    "Exploramos texturas suaves, rugosas y frías con paneles sensoriales.",
    ["paneles sensoriales", "telas de distintas texturas"]);
  await exp(planSalaCuna.rows[0].id, "2026-04-14", "Mi cara, mis emociones",
    "Reconocemos emociones básicas con cuentos y espejos.",
    ["espejo grupal", "libro 'El monstruo de colores'"]);
  await exp(planSalaCuna.rows[0].id, "2026-04-21", "Manos que crean",
    "Pintura libre con dedos sobre papel kraft grande.",
    ["témperas no tóxicas", "papel kraft"]);

  await exp(planMedioMenor.rows[0].id, "2026-04-08", "Visita al huerto",
    "Recorrido guiado y observación de plantas en distintas etapas.",
    ["lupas", "cuaderno de observación"]);
  await exp(planMedioMenor.rows[0].id, "2026-04-15", "Sembramos semillas",
    "Cada niño/a siembra su semilla en un macetero individual.",
    ["semillas de lentejas", "maceteros", "tierra"]);
}

/* ============ Mensajería ============ */

async function seedMensajeria(
  tx: Tx,
  usuarios: UsuariosSeed,
  ninos: NinoData[],
): Promise<void> {
  const conv = async (asunto: string, fijado: boolean, esGrupo: boolean, fecha: string) => {
    const r = await tx.query<{ id: number }>(
      `INSERT INTO conversaciones (asunto, es_grupo, fijado, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4) RETURNING id`,
      [asunto, esGrupo, fijado, fecha],
    );
    return r.rows[0].id;
  };

  const part = async (convId: number, usuarioId: number, ultimaLectura?: string) => {
    await tx.query(
      `INSERT INTO conversacion_participantes (conversacion_id, usuario_id, ultima_lectura)
       VALUES ($1, $2, $3)`,
      [convId, usuarioId, ultimaLectura ?? null],
    );
  };

  const msg = async (
    convId: number,
    autorId: number,
    contenido: string,
    fecha: string,
    estado: "enviado" | "entregado" | "leido",
    tipo: "texto" | "interactivo" = "texto",
    botones?: string[],
    respuesta?: string,
  ) => {
    await tx.query(
      `INSERT INTO mensajes (conversacion_id, autor_id, contenido, tipo, botones, respuesta, estado, fecha)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)`,
      [convId, autorId, contenido, tipo, botones ? JSON.stringify(botones) : null, respuesta ?? null, estado, fecha],
    );
  };

  // 1. Informe diario de Sofía — Angélica ↔ María
  const c1 = await conv("Informe diario de Sofía", false, false, "2026-04-10T14:30:00Z");
  await part(c1, usuarios.angelica);
  await part(c1, usuarios.mariaGonzalez, "2026-04-10T14:35:00Z");
  await msg(c1, usuarios.mariaGonzalez,
    "Estimada Angélica, adjunto el informe diario de Sofía. Tuvo un excelente día: durmió bien la siesta de la mañana, comió toda su colación y participó en la actividad de motricidad fina con mucho entusiasmo.",
    "2026-04-10T14:25:00Z", "entregado");
  await msg(c1, usuarios.mariaGonzalez,
    "También quería comentarte que ya está respondiendo a su nombre con mayor frecuencia. ¡Un avance muy bonito de la semana!",
    "2026-04-10T14:30:00Z", "entregado");

  // 2. Reunión de apoderados — grupal con interactivo
  const c2 = await conv("Reunión de apoderados — Mayo", true, true, "2026-04-09T09:00:00Z");
  await part(c2, usuarios.angelica);
  await part(c2, usuarios.carolinaVera, "2026-04-09T10:00:00Z");
  await part(c2, usuarios.andreaDiaz, "2026-04-09T10:00:00Z");
  await msg(c2, usuarios.angelica,
    "Estimados apoderados, les informamos que la próxima reunión general se realizará el jueves 15 de mayo a las 18:30 en el salón principal del centro infantil. Se tratarán temas importantes relacionados con el plan educativo 2026. Por favor confirmen su asistencia.",
    "2026-04-09T09:00:00Z", "leido", "interactivo",
    ["Confirmo asistencia", "No podré asistir"], "Confirmo asistencia");

  // 3. Consulta sobre alimentación — Carolina (apoderada)
  const c3 = await conv("Consulta sobre alimentación", false, false, "2026-04-10T11:15:00Z");
  await part(c3, usuarios.angelica);
  await part(c3, usuarios.carolinaVera, "2026-04-10T11:20:00Z");
  await msg(c3, usuarios.carolinaVera,
    "Hola, buen día. Quería consultar si podrían considerar una alternativa para la colación de Sofía los días miércoles. Comentamos con el pediatra que está probando nuevos alimentos y nos recomendó evitar los lácteos por ahora. ¿Sería posible coordinarlo con la educadora?",
    "2026-04-10T11:15:00Z", "entregado");

  // 4. Planificación mensual Medio Menor
  const c4 = await conv("Planificación mensual Medio Menor", false, false, "2026-04-08T16:40:00Z");
  await part(c4, usuarios.angelica, "2026-04-08T16:41:00Z");
  await part(c4, usuarios.claudiaRamirez, "2026-04-08T16:41:00Z");
  await msg(c4, usuarios.claudiaRamirez,
    "Te dejo el borrador de la planificación del mes con las nuevas experiencias de aprendizaje. Agregué dos salidas a la biblioteca comunal y una visita guiada al huerto escolar.",
    "2026-04-08T16:35:00Z", "leido");
  await msg(c4, usuarios.angelica,
    "Perfecto Claudia, la reviso mañana y te confirmo cualquier ajuste. ¡Se ve muy completa!",
    "2026-04-08T16:40:00Z", "leido");

  // 5. Autorización salida educativa — grupal
  const c5 = await conv("Autorización salida educativa", false, true, "2026-04-07T10:20:00Z");
  await part(c5, usuarios.angelica);
  await part(c5, usuarios.carolinaVera, "2026-04-07T11:00:00Z");
  await msg(c5, usuarios.angelica,
    "Estimados apoderados, solicitamos su autorización para la salida educativa al Parque Metropolitano el día viernes 25 de abril. La actividad está coordinada con la Corporación Parquemet y cuenta con transporte y colación incluida.",
    "2026-04-07T10:20:00Z", "leido", "interactivo",
    ["Autorizo", "No autorizo"]);

  // 6. Comunicado COVID — grupal informativo
  const c6 = await conv("Comunicado general — Protocolo COVID", false, true, "2026-04-05T08:00:00Z");
  await part(c6, usuarios.angelica);
  await part(c6, usuarios.carolinaVera, "2026-04-05T09:00:00Z");
  await msg(c6, usuarios.angelica,
    "Les recordamos las medidas sanitarias vigentes para el ingreso al centro: control de temperatura, uso de alcohol gel y lavado de manos al ingresar. Agradecemos su colaboración.",
    "2026-04-05T08:00:00Z", "leido");

  // Borradores
  await tx.query(
    `INSERT INTO borradores_mensaje (centro_id, autor_id, destinatario, asunto, contenido)
     VALUES ($1, $2, $3, $4, $5), ($1, $2, $6, $7, $8)`,
    [
      ninos[0].centroId,
      usuarios.angelica,
      "Todos los apoderados",
      "Actividad día de la familia",
      "Queridos apoderados, los invitamos a nuestra celebración del Día de la Familia el sábado 10 de mayo…",
      "Apoderados Medio Mayor",
      "Recordatorio materiales para taller de arte",
      "Les recordamos traer los materiales solicitados para el taller de arte del próximo viernes…",
    ],
  );
}

/* ============ Eventos del calendario ============ */

async function seedEventos(
  tx: Tx,
  {
    centroGirasoles,
    centroBrotitos,
    usuarios,
    salas,
  }: {
    centroGirasoles: number;
    centroBrotitos: number;
    usuarios: UsuariosSeed;
    salas: SalasSeed;
  },
): Promise<void> {
  const feriados: Array<[string, string, string]> = [
    ["Año Nuevo", "Feriado legal", "2026-01-01"],
    ["Viernes Santo", "Feriado religioso", "2026-04-03"],
    ["Sábado Santo", "Feriado religioso", "2026-04-04"],
    ["Día del Trabajador", "Feriado legal", "2026-05-01"],
    ["Día de las Glorias Navales", "Feriado legal", "2026-05-21"],
    ["Día Nacional de los Pueblos Indígenas", "Feriado legal", "2026-06-20"],
    ["San Pedro y San Pablo", "Feriado religioso", "2026-06-29"],
    ["Día de la Virgen del Carmen", "Feriado religioso", "2026-07-16"],
    ["Asunción de la Virgen", "Feriado religioso", "2026-08-15"],
    ["Fiestas Patrias", "Independencia de Chile", "2026-09-18"],
    ["Glorias del Ejército", "Feriado legal", "2026-09-19"],
    ["Encuentro de Dos Mundos", "Feriado legal", "2026-10-12"],
    ["Día de las Iglesias Evangélicas", "Feriado legal", "2026-10-31"],
    ["Día de Todos los Santos", "Feriado religioso", "2026-11-01"],
    ["Inmaculada Concepción", "Feriado religioso", "2026-12-08"],
    ["Navidad", "Feriado religioso", "2026-12-25"],
  ];
  // Los feriados aplican a ambos centros (los repetimos)
  for (const centroId of [centroGirasoles, centroBrotitos]) {
    for (const [titulo, descripcion, fecha] of feriados) {
      await tx.query(
        `INSERT INTO eventos (centro_id, titulo, descripcion, fecha, tipo)
         VALUES ($1, $2, $3, $4, 'feriado')`,
        [centroId, titulo, descripcion, fecha],
      );
    }
  }

  // Eventos del centro Girasoles
  const eventos: Array<{
    titulo: string;
    descripcion: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    tipo: "reunion" | "actividad" | "celebracion";
    modalidad: "presencial" | "online";
    ubicacion?: string;
    alcanceSala?: number;
    recordatorio?: boolean;
  }> = [
    { titulo: "Reunión equipo docente", descripcion: "Revisión de planificación semanal y coordinación de actividades.", fecha: "2026-04-13", horaInicio: "08:30", horaFin: "09:30", tipo: "reunion", modalidad: "presencial", ubicacion: "Sala de reuniones", recordatorio: true },
    { titulo: "Reunión con Dirección Regional", descripcion: "Revisión de indicadores trimestrales del centro.", fecha: "2026-04-17", horaInicio: "10:00", horaFin: "11:30", tipo: "reunion", modalidad: "online", recordatorio: true },
    { titulo: "Taller de motricidad fina", descripcion: "Actividad con plasticinas y material sensorial.", fecha: "2026-04-22", horaInicio: "10:30", horaFin: "11:30", tipo: "actividad", modalidad: "presencial", ubicacion: "Sala Cuna Mayor", alcanceSala: salas.salaCunaMayor },
    { titulo: "Celebración Día del Libro", descripcion: "Cuentacuentos con apoderados invitados y feria del libro infantil.", fecha: "2026-04-23", horaInicio: "09:30", horaFin: "11:00", tipo: "celebracion", modalidad: "presencial", ubicacion: "Salón principal" },
    { titulo: "Salida educativa: Parque Metropolitano", descripcion: "Visita guiada con la Corporación Parquemet. Transporte y colación incluidos.", fecha: "2026-04-25", horaInicio: "09:00", horaFin: "13:00", tipo: "actividad", modalidad: "presencial", ubicacion: "Parque Metropolitano", recordatorio: true },
    { titulo: "Salida al huerto comunitario", descripcion: "Experiencia de aprendizaje: siembra y cuidado de plantas.", fecha: "2026-05-08", horaInicio: "10:00", horaFin: "12:00", tipo: "actividad", modalidad: "presencial", ubicacion: "Huerto comunal Providencia", alcanceSala: salas.medioMenor },
    { titulo: "Día de la Familia", descripcion: "Actividad conjunta con apoderados. Talleres, juegos y convivencia.", fecha: "2026-05-10", horaInicio: "10:00", horaFin: "13:00", tipo: "celebracion", modalidad: "presencial", ubicacion: "Centro Infantil", recordatorio: true },
    { titulo: "Reunión de apoderados", descripcion: "Reunión general: plan educativo 2026 y novedades del trimestre.", fecha: "2026-05-15", horaInicio: "18:30", horaFin: "20:00", tipo: "reunion", modalidad: "presencial", ubicacion: "Salón principal", recordatorio: true },
  ];

  for (const e of eventos) {
    await tx.query(
      `INSERT INTO eventos
        (centro_id, titulo, descripcion, fecha, hora_inicio, hora_fin, tipo, modalidad, ubicacion, alcance_sala_id, recordatorio, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        centroGirasoles,
        e.titulo,
        e.descripcion,
        e.fecha,
        e.horaInicio,
        e.horaFin,
        e.tipo,
        e.modalidad,
        e.ubicacion ?? null,
        e.alcanceSala ?? null,
        e.recordatorio ?? false,
        usuarios.angelica,
      ],
    );
  }
}

/* ============ Mural (publicaciones + likes + comentarios + adjuntos) ============ */

async function seedMural(
  tx: Tx,
  { centroGirasoles, usuarios }: { centroGirasoles: number; usuarios: UsuariosSeed },
): Promise<void> {
  const pub = async (
    autorId: number,
    titulo: string,
    contenido: string,
    fecha: string,
    destacado = false,
  ) => {
    const r = await tx.query<{ id: number }>(
      `INSERT INTO publicaciones (centro_id, autor_id, titulo, contenido, destacado, fecha)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [centroGirasoles, autorId, titulo, contenido, destacado, fecha],
    );
    return r.rows[0].id;
  };

  const adjunto = async (
    pubId: number,
    nombre: string,
    tipo: "pdf" | "doc" | "imagen",
    tamano: number,
  ) => {
    await tx.query(
      `INSERT INTO adjuntos (entidad, entidad_id, nombre, tipo, tamano_bytes)
       VALUES ('publicacion', $1, $2, $3, $4)`,
      [pubId, nombre, tipo, tamano],
    );
  };

  const apoderadosLikers = [
    usuarios.carolinaVera, usuarios.andreaDiaz, usuarios.camilaSoto,
    usuarios.constanzaBravo, usuarios.macarenaMunoz, usuarios.franciscaAraya,
    usuarios.javieraReyes, usuarios.paulaFuentes,
  ];

  const likes = async (pubId: number, cuantos: number) => {
    for (let i = 0; i < Math.min(cuantos, apoderadosLikers.length); i++) {
      await tx.query(
        `INSERT INTO publicacion_likes (publicacion_id, usuario_id) VALUES ($1, $2)`,
        [pubId, apoderadosLikers[i]],
      );
    }
  };

  const comentario = async (pubId: number, autorId: number, contenido: string, fecha: string) => {
    await tx.query(
      `INSERT INTO comentarios (publicacion_id, autor_id, contenido, fecha)
       VALUES ($1, $2, $3, $4)`,
      [pubId, autorId, contenido, fecha],
    );
  };

  const p1 = await pub(usuarios.angelica,
    "Bienvenida al nuevo período 2026",
    "Estimada comunidad educativa, les damos la bienvenida al año 2026. Este período viene con muchas novedades: nuevas actividades educativas, renovación del huerto escolar y una mejor coordinación con las familias a través de esta nueva agenda digital. Agradecemos su confianza y compromiso con el desarrollo integral de nuestros párvulos.",
    "2026-04-10T09:00:00Z", true);
  await adjunto(p1, "Calendario-academico-2026.pdf", "pdf", 345_000);
  await likes(p1, 8);
  await comentario(p1, usuarios.carolinaVera, "¡Felicitaciones por la nueva plataforma, se ve muy completa!", "2026-04-10T10:30:00Z");

  const p2 = await pub(usuarios.angelica,
    "Salida educativa al Parque Metropolitano",
    "Informamos que el día viernes 25 de abril realizaremos una salida educativa al Parque Metropolitano para todos los niveles. La actividad está coordinada con Parquemet e incluye transporte y colación. Recuerden firmar la autorización que encontrarán en el módulo de mensajes antes del 22 de abril.",
    "2026-04-08T14:30:00Z");
  await adjunto(p2, "Autorizacion-salida.pdf", "pdf", 128_000);
  await adjunto(p2, "Itinerario-salida.pdf", "pdf", 210_000);
  await likes(p2, 6);

  const p3 = await pub(usuarios.mariaGonzalez,
    "Taller de motricidad fina esta semana",
    "Esta semana comenzamos un ciclo de talleres de motricidad fina con plasticinas y material sensorial de texturas. Los niños están explorando con mucho entusiasmo. Compartiremos fotos del proceso en los informes diarios.",
    "2026-04-07T11:15:00Z");
  await likes(p3, 5);

  const p4 = await pub(usuarios.angelica,
    "Recordatorio: jornada de vacunación",
    "Les recordamos que la próxima semana el CESFAM realizará la jornada de vacunación escolar. Por favor, traer el carnet de control sano al día. Cualquier consulta, contactar a dirección.",
    "2026-04-05T08:45:00Z");
  await likes(p4, 3);

  const p5 = await pub(usuarios.claudiaRamirez,
    "Fotos de nuestra visita al huerto",
    "Les compartimos algunas fotos de la visita al huerto comunitario de la semana pasada. Los niños aprendieron sobre siembra y cuidado de plantas. ¡Fue una experiencia maravillosa!",
    "2026-04-03T16:20:00Z");
  await adjunto(p5, "huerto-01.jpg", "imagen", 2_100_000);
  await adjunto(p5, "huerto-02.jpg", "imagen", 1_800_000);
  await adjunto(p5, "huerto-03.jpg", "imagen", 2_400_000);
  await likes(p5, 8);
  await comentario(p5, usuarios.franciscaAraya, "¡Qué lindas las fotos! Tomás vino feliz ese día.", "2026-04-03T17:00:00Z");
}

/* ============ Documentos institucionales ============ */

async function seedDocumentosInstitucionales(
  tx: Tx,
  { centroGirasoles, centroBrotitos }: { centroGirasoles: number; centroBrotitos: number },
): Promise<void> {
  const docs = [
    { titulo: "Reglamento Interno", desc: "Normas de convivencia y funcionamiento del centro infantil", fecha: "2026-03-01", tamano: 842_000 },
    { titulo: "Plan Educativo 2026", desc: "Lineamientos pedagógicos y objetivos del año en curso", fecha: "2026-03-15", tamano: 1_300_000 },
    { titulo: "Protocolo de Emergencia", desc: "Procedimientos ante sismos, incendios y situaciones de riesgo", fecha: "2026-02-20", tamano: 567_000 },
  ];
  for (const centroId of [centroGirasoles, centroBrotitos]) {
    for (const d of docs) {
      await tx.query(
        `INSERT INTO documentos_institucionales
          (centro_id, titulo, descripcion, fecha_actualizacion, tamano_bytes, tipo)
         VALUES ($1, $2, $3, $4, $5, 'pdf')`,
        [centroId, d.titulo, d.desc, d.fecha, d.tamano],
      );
    }
  }
}

/* ============ Feed de actividad ============ */

async function seedActividades(
  tx: Tx,
  { centroGirasoles, usuarios }: { centroGirasoles: number; usuarios: UsuariosSeed },
): Promise<void> {
  const actividades: Array<{
    tipo: "informe" | "mensaje" | "asistencia" | "evento";
    titulo: string;
    descripcion: string;
    usuarioId: number;
    fecha: string;
  }> = [
    { tipo: "informe", titulo: "Informe diario publicado", descripcion: "María González publicó el informe de Sala Cuna Mayor", usuarioId: usuarios.mariaGonzalez, fecha: "2026-04-10T14:30:00Z" },
    { tipo: "mensaje", titulo: "Nuevo mensaje de Dirección", descripcion: "Reunión de apoderados — confirmación de asistencia", usuarioId: usuarios.angelica, fecha: "2026-04-10T13:30:00Z" },
    { tipo: "asistencia", titulo: "Asistencia registrada", descripcion: "Claudia Ramírez cerró la asistencia de Medio Menor", usuarioId: usuarios.claudiaRamirez, fecha: "2026-04-10T12:30:00Z" },
    { tipo: "evento", titulo: "Retiro anticipado", descripcion: "Tomás Silva retirado a las 14:30 por apoderado", usuarioId: usuarios.franciscaAraya, fecha: "2026-04-10T11:30:00Z" },
  ];
  for (const a of actividades) {
    await tx.query(
      `INSERT INTO actividades (centro_id, tipo, titulo, descripcion, usuario_id, fecha)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [centroGirasoles, a.tipo, a.titulo, a.descripcion, a.usuarioId, a.fecha],
    );
  }
}

/* ============ Notificaciones (push fake) ============ */

async function seedNotificaciones(tx: Tx, usuarios: UsuariosSeed): Promise<void> {
  // 3 sin leer para Angélica (matchea el "mensajesSinLeer: 3" del mock)
  const notifs: Array<{
    usuarioId: number;
    tipo: "mensaje" | "asistencia" | "evento" | "informe" | "publicacion" | "sistema";
    titulo: string;
    cuerpo: string;
    link: string;
    leida: boolean;
    fecha: string;
  }> = [
    { usuarioId: usuarios.angelica, tipo: "mensaje", titulo: "Nuevo mensaje de María González", cuerpo: "Informe diario de Sofía", link: "/dashboard/mensajes", leida: false, fecha: "2026-04-10T14:30:00Z" },
    { usuarioId: usuarios.angelica, tipo: "mensaje", titulo: "Nuevo mensaje de Carolina Vera", cuerpo: "Consulta sobre alimentación", link: "/dashboard/mensajes", leida: false, fecha: "2026-04-10T11:15:00Z" },
    { usuarioId: usuarios.angelica, tipo: "evento", titulo: "Recordatorio: Reunión equipo docente", cuerpo: "Mañana a las 08:30 en Sala de reuniones", link: "/dashboard/calendario", leida: false, fecha: "2026-04-10T08:00:00Z" },
    { usuarioId: usuarios.angelica, tipo: "informe", titulo: "Informe publicado", cuerpo: "María González cerró el informe diario de Sala Cuna Mayor", link: "/dashboard/informes", leida: true, fecha: "2026-04-09T17:00:00Z" },
    { usuarioId: usuarios.angelica, tipo: "publicacion", titulo: "Nueva publicación en el mural", cuerpo: "Claudia compartió 'Fotos de nuestra visita al huerto'", link: "/dashboard/mural", leida: true, fecha: "2026-04-03T16:20:00Z" },
  ];
  for (const n of notifs) {
    await tx.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, cuerpo, link, leida, leida_at, fecha)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [n.usuarioId, n.tipo, n.titulo, n.cuerpo, n.link, n.leida, n.leida ? n.fecha : null, n.fecha],
    );
  }
}

/* ============ Sesión activa ============ */

async function seedSesion(
  tx: Tx,
  { usuarios, centroGirasoles }: { usuarios: UsuariosSeed; centroGirasoles: number },
): Promise<void> {
  await tx.query(
    `INSERT INTO sesion (id, usuario_id, centro_activo_id) VALUES (1, $1, $2)`,
    [usuarios.angelica, centroGirasoles],
  );
}
