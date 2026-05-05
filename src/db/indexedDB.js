import { openDB } from 'idb';

const DB_NAME = 'arctic-hvac';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Job history store
        if (!db.objectStoreNames.contains('jobs')) {
          const jobStore = db.createObjectStore('jobs', { keyPath: 'id' });
          jobStore.createIndex('createdAt', 'createdAt');
          jobStore.createIndex('techId', 'techId');
        }
        // Offline cache for PT charts, fault codes (already in JS but mirror here for SW)
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
        // Pending sync queue (jobs created offline)
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

// ── Jobs (local cache) ─────────────────────────────────────────────────────────
export async function saveJobLocally(job) {
  const db = await getDB();
  await db.put('jobs', { ...job, syncStatus: 'pending', updatedAt: Date.now() });
}

export async function getLocalJobs(limit = 50) {
  const db = await getDB();
  const all = await db.getAllFromIndex('jobs', 'createdAt');
  return all.reverse().slice(0, limit);
}

export async function getLocalJobById(id) {
  const db = await getDB();
  return db.get('jobs', id);
}

export async function markJobSynced(id) {
  const db = await getDB();
  const job = await db.get('jobs', id);
  if (job) {
    await db.put('jobs', { ...job, syncStatus: 'synced' });
  }
}

export async function deleteLocalJob(id) {
  const db = await getDB();
  await db.delete('jobs', id);
}

// ── Sync queue (offline → online) ─────────────────────────────────────────────
export async function addToSyncQueue(job) {
  const db = await getDB();
  await db.add('syncQueue', { job, queuedAt: Date.now() });
}

export async function getSyncQueue() {
  const db = await getDB();
  return db.getAll('syncQueue');
}

export async function clearSyncItem(id) {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

// ── Generic cache ──────────────────────────────────────────────────────────────
export async function cacheSet(key, value) {
  const db = await getDB();
  await db.put('cache', { key, value, cachedAt: Date.now() });
}

export async function cacheGet(key) {
  const db = await getDB();
  const entry = await db.get('cache', key);
  return entry?.value ?? null;
}
