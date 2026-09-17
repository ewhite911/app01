import * as SQLite from 'expo-sqlite';

export type Prayer = {
  id: number;
  text: string;
  created_at: string; // ISO
  answered_at: string | null;
  prayed_count: number;
};

const db = SQLite.openDatabaseSync('selah.db');

export function initDb() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS prayers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      answered_at TEXT,
      prayed_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS routine_log (
      day TEXT PRIMARY KEY,
      completed_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

export function listPrayers(): Prayer[] {
  return db.getAllSync<Prayer>(
    'SELECT * FROM prayers ORDER BY (answered_at IS NOT NULL), created_at DESC'
  );
}

export function activePrayers(): Prayer[] {
  return db.getAllSync<Prayer>(
    'SELECT * FROM prayers WHERE answered_at IS NULL ORDER BY created_at DESC'
  );
}

export function addPrayer(text: string) {
  db.runSync('INSERT INTO prayers (text, created_at) VALUES (?, ?)', [
    text.trim(),
    new Date().toISOString(),
  ]);
}

export function markAnswered(id: number, answered: boolean) {
  db.runSync('UPDATE prayers SET answered_at = ? WHERE id = ?', [
    answered ? new Date().toISOString() : null,
    id,
  ]);
}

export function deletePrayer(id: number) {
  db.runSync('DELETE FROM prayers WHERE id = ?', [id]);
}

export function bumpPrayed(ids: number[]) {
  for (const id of ids) {
    db.runSync('UPDATE prayers SET prayed_count = prayed_count + 1 WHERE id = ?', [id]);
  }
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function markRoutineDone() {
  db.runSync('INSERT OR REPLACE INTO routine_log (day, completed_at) VALUES (?, ?)', [
    todayKey(),
    new Date().toISOString(),
  ]);
}

export function routineDoneToday(): boolean {
  const row = db.getFirstSync<{ day: string }>('SELECT day FROM routine_log WHERE day = ?', [
    todayKey(),
  ]);
  return !!row;
}

export function routineCount(): number {
  const row = db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM routine_log');
  return row?.n ?? 0;
}

export function getSetting(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export function setSetting(key: string, value: string | null) {
  if (value === null) db.runSync('DELETE FROM settings WHERE key = ?', [key]);
  else db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

export function exportAll() {
  return {
    exported_at: new Date().toISOString(),
    app: 'Selah Daily',
    prayers: db.getAllSync<Prayer>('SELECT * FROM prayers ORDER BY id'),
    routine_log: db.getAllSync<{ day: string; completed_at: string }>(
      'SELECT * FROM routine_log ORDER BY day'
    ),
  };
}

export function importAll(data: { prayers?: Prayer[]; routine_log?: { day: string; completed_at: string }[] }) {
  db.withTransactionSync(() => {
    for (const p of data.prayers ?? []) {
      db.runSync(
        'INSERT INTO prayers (text, created_at, answered_at, prayed_count) VALUES (?, ?, ?, ?)',
        [p.text, p.created_at, p.answered_at ?? null, p.prayed_count ?? 0]
      );
    }
    for (const r of data.routine_log ?? []) {
      db.runSync('INSERT OR IGNORE INTO routine_log (day, completed_at) VALUES (?, ?)', [
        r.day,
        r.completed_at,
      ]);
    }
  });
}

/** The date this phone first became a member. Set once; never cleared on cancel. */
export function memberSince(): Date | null {
  const v = getSetting('member_since');
  return v ? new Date(v) : null;
}

export function markMemberSince(d = new Date()) {
  if (!getSetting('member_since')) setSetting('member_since', d.toISOString());
}
