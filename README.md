# Aula — Jardín Infantil Girasoles

Demo navegable de la plataforma de gestión y comunicación para el Jardín
Infantil "Girasoles", un centro ficticio de la Red Comunitaria de Jardines
Infantiles.

**Vive 100% en el navegador.** No hay servidor: Postgres corre dentro del
browser vía WASM y todos los datos persisten en IndexedDB del visitante.
Cada quien tiene su propia copia. El botón "Reset demo" reinicia el seed.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **Tailwind CSS 4** + **shadcn/ui**
- **PGlite** — Postgres completo en WASM con persistencia IndexedDB
- **@react-pdf/renderer** — generación de PDFs declarativa

## Correrlo

```bash
pnpm install
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000). Primer arranque tarda
un instante mientras se crea el schema y se aplica el seed en IndexedDB.

## Qué tiene de interesante

- **9 pantallas funcionales** con SQL real (joins, agregaciones, `LISTEN/NOTIFY`)
  contra una base PGlite local — no hay datos mockeados.
- **Multi-jardín**: dos centros precargados. La directora regional
  (super_admin) puede alternar entre ambos desde el header.
- **Switcher de usuario**: probá el demo desde la mirada de la directora,
  una educadora o un apoderado. Lo que ve cada rol cambia con los datos.
- **Notificaciones vivas**: `pg_notify` propaga eventos entre componentes
  sin polling. Mandá un mensaje y el badge del destinatario se actualiza
  en tiempo real.
- **Reportes PDF**: ficha del párvulo, asistencia mensual y lista de
  apoderados generados desde los datos reales del centro activo. Queda
  un historial en `reportes_generados`.

## Estructura

```
app/
  dashboard/           # pantallas autenticadas
  login/               # selector de usuario para entrar al demo
lib/
  db/
    schema.ts          # 21 tablas, 16 enums
    client.ts          # PGlite singleton + IndexedDB
    seed.ts            # datos iniciales
    sesion-context.tsx # usuario + centro activos (global)
    use-db-query.ts    # hook para reads
    use-db-mutation.ts # hook para writes
    use-db-listen.ts   # LISTEN/NOTIFY
    repositories/      # capa de acceso por dominio
  reports/             # documentos PDF declarativos
  utils/               # helpers puros (fechas, formato)
components/
  dashboard/           # header, badges, popovers
  ui/                  # shadcn primitives
```

## Reset del demo

Botón refresh en el header. Borra el IndexedDB y re-aplica el seed.
El usuario activo vuelve a ser Angélica Fica (directora de Girasoles).

## Notas

Esto es una **maqueta interactiva**. No hay autenticación real, todas las
mutaciones quedan en el navegador del visitante y no hay sincronización
entre dispositivos. Pensado para mostrar el alcance de la plataforma al
cliente sin necesidad de infraestructura.
