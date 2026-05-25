// Cliente PGlite — singleton browser-only con persistencia IndexedDB.
// PGlite es Postgres compilado a WASM. Toda la API es client-side: no se importa en
// Server Components.

import { PGlite } from "@electric-sql/pglite";
import { SCHEMA_SQL, SCHEMA_VERSION } from "./schema";
import { seedDatabase } from "./seed";

const IDB_NAME = "semillitas-agenda";
const META_KEY = "schema_version";

let instance: PGlite | null = null;
let initPromise: Promise<PGlite> | null = null;

async function initialize(): Promise<PGlite> {
  const db = new PGlite(`idb://${IDB_NAME}`);
  await db.waitReady;

  // Tabla meta para detectar primera vez vs DB ya inicializada.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS _meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const result = await db.query<{ value: string }>(
    `SELECT value FROM _meta WHERE key = $1`,
    [META_KEY],
  );
  const currentVersion = result.rows[0]
    ? Number.parseInt(result.rows[0].value, 10)
    : 0;

  if (currentVersion === SCHEMA_VERSION) {
    return db;
  }

  // Schema desactualizado o ausente: re-creamos todo desde cero.
  // Para un demo sin migraciones esto es lo más simple y predecible.
  if (currentVersion > 0) {
    await db.close();
    await deleteIndexedDbDatabase(IDB_NAME);
    // Recrear instancia limpia
    const fresh = new PGlite(`idb://${IDB_NAME}`);
    await fresh.waitReady;
    await applySchemaAndSeed(fresh);
    return fresh;
  }

  await applySchemaAndSeed(db);
  return db;
}

async function applySchemaAndSeed(db: PGlite): Promise<void> {
  await db.exec(SCHEMA_SQL);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS _meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  await seedDatabase(db);
  await db.query(
    `INSERT INTO _meta (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [META_KEY, String(SCHEMA_VERSION)],
  );
}

function deleteIndexedDbDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(`/pglite/${name}`);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve(); // continuamos igual; PGlite reabrirá limpio
  });
}

export function getDb(): Promise<PGlite> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("PGlite solo puede usarse en el cliente (browser)."),
    );
  }
  if (instance) return Promise.resolve(instance);
  if (!initPromise) {
    initPromise = initialize().then((db) => {
      instance = db;
      return db;
    });
  }
  return initPromise;
}

export async function resetDb(): Promise<PGlite> {
  if (instance) {
    await instance.close();
    instance = null;
  }
  initPromise = null;
  await deleteIndexedDbDatabase(IDB_NAME);
  return getDb();
}
