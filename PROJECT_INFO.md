# Maqueta Web — Agenda Digital "Semillitas del Oriente"

## Instrucciones para Claude Code

Este documento contiene las indicaciones para construir una maqueta web funcional (frontend) de la plataforma "Agenda Digital Semillitas del Oriente". El objetivo es tener un demo visual e interactivo para presentar al cliente (Servicio de Salud Metropolitano Oriente) y mostrar las capacidades de la solución.

---

## 1. Contexto del Proyecto

**Cliente:** Centro Infantil "Semillitas del Oriente" — Servicio de Salud Metropolitano Oriente (DSSMO).

**Qué es:** Una agenda digital para la comunicación entre apoderados y el centro infantil, con módulos de mensajería, informes diarios, asistencia, calendario, planificación curricular y fichas de párvulos.

**Usuarios del sistema:**
- **Directora/Jefatura** — acceso total, gestión administrativa
- **Docentes/Educadoras** — informes diarios, asistencia, mensajes, planificación
- **Apoderados** — visualización de informes, mensajes, calendario (esto es para la app móvil, pero en la maqueta web se puede mostrar una vista previa)

**Importante:** Esto es una MAQUETA de demostración. No necesita backend real. Usa datos ficticios hardcodeados. El objetivo es que se vea profesional y muestre el flujo de uso.

---

## 2. Stack Técnico

```
Framework:    Next.js 16+ (App Router)
Estilos:      Tailwind CSS 4+
Iconos:       Remix Icon
Despliegue:   Vercel (ya disponible)
Datos:        Datos ficticios en archivos JSON o constantes
```

---

## 3. Identidad Visual

Paleta de colores, Tipografia y components.json iniciado con Shadcn con todos los componentes instalados

### Logo placeholder

Usar un SVG simple como placeholder del logo "Semillitas del Oriente".

---

## 4. Estructura de Páginas y Layout

### Layout principal (dashboard)

```
┌─────────────────────────────────────────────────┐
│  Header: Logo + nombre + notificaciones + perfil │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ Sidebar  │         Contenido principal          │
│          │                                      │
│ - Inicio │                                      │
│ - Mensajes│                                     │
│ - Informes│                                     │
│ - Asistencia│                                   │
│ - Calendario│                                   │
│ - Planificación│                                │
│ - Párvulos│                                     │
│ - Mural  │                                      │
│          │                                      │
├──────────┴──────────────────────────────────────┤
│  Footer (mínimo)                                 │
└─────────────────────────────────────────────────┘
```

- El sidebar debe ser colapsable en pantallas pequeñas (responsive).
- En móvil, usar un menú hamburguesa.
- Mostrar el nombre del usuario logueado y su rol.

---

## 5. Páginas a Construir

### 5.1 Login (página pública)

**Ruta:** `/login`

**Elementos:**
- Logo + nombre "Semillitas del Oriente"
- Subtítulo: "Agenda Digital"
- Campo de email
- Campo de contraseña
- Botón "Iniciar Sesión"
- Link "¿Olvidaste tu contraseña?"
- Fondo con ilustración suave o gradiente

**Comportamiento maqueta:** Al hacer click en "Iniciar Sesión", redirigir directamente al dashboard sin validación real. Opcionalmente, ofrecer un selector de rol (Directora / Docente / Apoderado) para mostrar diferentes vistas.

---

### 5.2 Dashboard / Inicio

**Ruta:** `/dashboard`

**Elementos:**
- Saludo: "Buenos días, Angélica 👋"
- Tarjetas de resumen:
  - Total de niños matriculados (ej: 45)
  - Asistencia del día (ej: 38 presentes, 5 ausentes, 2 atrasados)
  - Mensajes sin leer (ej: 3)
  - Próximo evento (ej: "Reunión de apoderados — 15 de mayo")
- Gráfico simple de asistencia semanal (puede ser un bar chart con CSS puro o una librería liviana)
- Lista de actividades recientes

---

### 5.3 Mensajes

**Ruta:** `/dashboard/mensajes`

**Elementos:**
- Lista de conversaciones (tipo inbox) en panel izquierdo
- Vista de conversación seleccionada en panel derecho
- Cada mensaje muestra: remitente, fecha/hora, contenido, estado de lectura (✓ leído / ✓✓ entregado)
- Botón "Nuevo mensaje" que abre un modal/formulario con:
  - Selector de destinatario (individual o grupal)
  - Campo de asunto
  - Editor de texto
  - Botón de adjuntar archivo
  - Opción "Programar envío" (mostrar date picker)
  - Opción de mensaje interactivo: "Agregar botones de respuesta" (Autoriza / No autoriza)
- Pestaña o sección de "Borradores"

**Datos ficticios sugeridos:**
```json
[
  {
    "id": 1,
    "remitente": "María González (Educadora Sala Cuna)",
    "asunto": "Informe diario de Sofía",
    "preview": "Hoy Sofía tuvo un excelente día...",
    "fecha": "2026-04-10 14:30",
    "leido": false
  },
  {
    "id": 2,
    "remitente": "Dirección",
    "asunto": "Reunión de apoderados — Mayo",
    "preview": "Estimados apoderados, les informamos...",
    "fecha": "2026-04-09 09:00",
    "leido": true,
    "tipo": "interactivo",
    "botones": ["Confirmo asistencia", "No podré asistir"]
  }
]
```

---

### 5.4 Informes Diarios

**Ruta:** `/dashboard/informes`

**Elementos:**
- Selector de fecha (por defecto hoy)
- Selector de nivel/sala (ej: "Sala Cuna Mayor", "Medio Menor")
- Lista de niños presentes ese día (integrado con asistencia)
- Para cada niño, un formulario de informe con campos personalizables:
  - Alimentación (desayuno, almuerzo, once) — checkbox o selector
  - Siesta (hora inicio, hora fin)
  - Mudas/baño
  - Estado de ánimo (emojis: 😊 😐 😢)
  - Actividades realizadas
  - Observaciones
  - Adjuntar foto
- Botón "Guardar borrador" y "Publicar informe"
- Estado: borrador / publicado / despublicado para corrección

---

### 5.5 Asistencia

**Ruta:** `/dashboard/asistencia`

**Elementos:**
- Selector de fecha
- Selector de nivel/sala o jornada
- Tabla/lista de niños con opciones:
  - 🟢 Presente
  - 🔴 Ausente
  - 🟡 Atrasado
  - Botón de "Retiro anticipado" con campo de hora
- Resumen visual: "32 presentes | 5 ausentes | 3 atrasados"
- Botón "Exportar reporte" (simulado)
- Botón "Imprimir" (simulado)

**Datos ficticios sugeridos (8-10 niños por sala):**
```json
[
  { "nombre": "Sofía Muñoz", "sala": "Sala Cuna Mayor", "estado": "presente" },
  { "nombre": "Matías Rojas", "sala": "Sala Cuna Mayor", "estado": "presente" },
  { "nombre": "Isidora Pérez", "sala": "Sala Cuna Mayor", "estado": "ausente" },
  { "nombre": "Tomás Silva", "sala": "Sala Cuna Mayor", "estado": "atrasado" },
  { "nombre": "Valentina López", "sala": "Medio Menor", "estado": "presente" },
  { "nombre": "Benjamín Castro", "sala": "Medio Menor", "estado": "presente" }
]
```

---

### 5.6 Calendario

**Ruta:** `/dashboard/calendario`

**Elementos:**
- Vista de calendario mensual
- Eventos marcados con colores por tipo:
  - 🔵 Reunión
  - 🟢 Actividad educativa
  - 🟡 Celebración
  - 🔴 Feriado
- Click en un día muestra los eventos de ese día
- Botón "Nuevo evento" con formulario:
  - Título
  - Fecha y hora
  - Tipo (presencial / online)
  - Descripción
  - Nivel/sala o general
  - Recordatorio automático (checkbox)
- Feriados chilenos 2026 ya cargados como datos ficticios

---

### 5.7 Ficha del Párvulo

**Ruta:** `/dashboard/parvulos` (listado) y `/dashboard/parvulos/[id]` (detalle)

**Listado:**
- Tarjetas o tabla con foto, nombre, sala, edad
- Buscador por nombre
- Filtro por sala/nivel
- Indicador de estado de cuenta del apoderado (activo ✅ / pendiente ⏳)

**Detalle (ficha completa):**
- Foto de perfil del niño
- Secciones con tabs o acordeón:
  - **Datos personales:** nombre, fecha nacimiento, edad, país, dirección, grupo sanguíneo, fotografía
  - **Salud:** previsión, alergias, enfermedades, seguro escolar, datos nutricionales
  - **Familia:** personas autorizadas para retiro, contactos de emergencia, con quién vive, antecedentes laborales padres
  - **Educación:** periodo de adaptación, observaciones generales, convivencia escolar
  - **Documentos:** archivos adjuntos, entrevistas con apoderados
- Botón "Exportar PDF" y "Exportar Excel" (simulados)
- Recordatorio de cumpleaños visible

---

### 5.8 Mural

**Ruta:** `/dashboard/mural`

**Elementos:**
- Feed tipo "muro" con publicaciones de la dirección
- Cada publicación tiene: título, contenido, fecha, archivos adjuntos
- Documentos institucionales fijados arriba:
  - Reglamento interno
  - Plan educativo 2026
  - Protocolo de emergencia
- Botón "Nueva publicación" (solo visible para rol dirección/admin)

---

### 5.9 Planificación (opcional, si alcanza el tiempo)

**Ruta:** `/dashboard/planificacion`

**Elementos:**
- Vista semanal con bloques de actividades
- Referencia a Bases Curriculares (texto placeholder)
- Campos: ámbito, núcleo, objetivo de aprendizaje, experiencia, recursos
- Asociación a nivel/sala

---

## 6. Datos Ficticios Globales

### Niños (usar en toda la app)

```typescript
export const ninos = [
  { id: 1, nombre: "Sofía", apellido: "Muñoz Vera", sala: "Sala Cuna Mayor", fechaNacimiento: "2024-03-15", foto: null, apoderado: "Carolina Vera" },
  { id: 2, nombre: "Matías", apellido: "Rojas Díaz", sala: "Sala Cuna Mayor", fechaNacimiento: "2024-06-22", foto: null, apoderado: "Andrea Díaz" },
  { id: 3, nombre: "Isidora", apellido: "Pérez Soto", sala: "Sala Cuna Mayor", fechaNacimiento: "2024-01-10", foto: null, apoderado: "Camila Soto" },
  { id: 4, nombre: "Tomás", apellido: "Silva Araya", sala: "Medio Menor", fechaNacimiento: "2023-09-05", foto: null, apoderado: "Francisca Araya" },
  { id: 5, nombre: "Valentina", apellido: "López Reyes", sala: "Medio Menor", fechaNacimiento: "2023-11-18", foto: null, apoderado: "Javiera Reyes" },
  { id: 6, nombre: "Benjamín", apellido: "Castro Fuentes", sala: "Medio Menor", fechaNacimiento: "2023-07-30", foto: null, apoderado: "Paula Fuentes" },
  { id: 7, nombre: "Emilia", apellido: "Martínez Herrera", sala: "Medio Mayor", fechaNacimiento: "2023-02-14", foto: null, apoderado: "Daniela Herrera" },
  { id: 8, nombre: "Agustín", apellido: "Fernández Morales", sala: "Medio Mayor", fechaNacimiento: "2023-04-25", foto: null, apoderado: "Valentina Morales" },
];
```

### Salas/Niveles

```typescript
export const salas = [
  { id: 1, nombre: "Sala Cuna Mayor", educadora: "María González", capacidad: 20 },
  { id: 2, nombre: "Medio Menor", educadora: "Claudia Ramírez", capacidad: 25 },
  { id: 3, nombre: "Medio Mayor", educadora: "Patricia Núñez", capacidad: 25 },
];
```

### Usuario logueado (para el demo)

```typescript
export const usuarioDemo = {
  nombre: "Angélica Fica Masías",
  rol: "directora",
  cargo: "Jefa Centro Infantil",
  email: "afica@ssmoriente.cl"
};
```

---

## 7. Criterios de Calidad Visual

- **Profesional pero amigable:** No infantilizar demasiado. Es una herramienta de gestión, no un juego para niños. Usar colores cálidos pero con estructura limpia.
- **Responsive:** Debe verse bien en desktop (1280px+) y tablet (768px). No es necesario optimizar para móvil (eso será la app).
- **Interactividad:** Los botones deben tener hover states, las transiciones deben ser suaves, los modales deben funcionar.
- **Consistencia:** Usar los mismos componentes (cards, botones, inputs) en toda la app.
- **Accesibilidad básica:** Labels en formularios, contraste adecuado, estructura semántica.

---

## 8. Orden de Prioridad para Construir

1. Layout general (header, sidebar, estructura)
2. Login
3. Dashboard
4. Asistencia (es lo más visual e impactante para demo)
5. Mensajes
6. Ficha del Párvulo
7. Informes Diarios
8. Calendario
9. Mural
10. Planificación (solo si hay tiempo)

---

## 9. Notas para Claude Code

- Crear componentes reutilizables: `Card`, `Button`, `Modal`, `Badge`, `Table`, `Avatar`, `StatusBadge`.
- Usar un archivo `data/mock.ts` centralizado con todos los datos ficticios.
- Las fotos de perfil de niños pueden ser placeholders con las iniciales del nombre (avatar con letras).
- No es necesario implementar autenticación real. El login solo redirige.
- No usar base de datos. Todo en memoria/constantes.
- Priorizar que se vea bien y sea navegable sobre que sea funcionalmente completo.
- El sidebar debe indicar claramente en qué sección está el usuario (estado activo).
- Incluir un `README.md` con instrucciones para correr el proyecto localmente.

---

## 10. Comando para Iniciar con Claude Code

Puedes copiar y pegar esto como primer prompt en Claude Code:

```
Lee el archivo MAQUETA_SEMILLITAS_INSTRUCCIONES.md y construye el proyecto siguiendo 
las instrucciones paso a paso. Empieza por inicializar el proyecto Next.js, configurar 
la paleta de colores y tipografía, y luego construye el layout general con header y 
sidebar. Después continúa con las páginas en el orden de prioridad indicado.
```

---

*Documento preparado como guía de desarrollo. Última actualización: Abril 2026.*
