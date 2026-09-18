/**
 * The database, for the browser.
 *
 * Metro picks this file over `db.ts` when the platform is web, so the phone
 * code below it never changes. It exists for one reason: expo-sqlite's
 * synchronous API does not work in a browser — every `getAllSync` call comes
 * back "Sync operation timeout" — and running the real screens in a browser is
 * the only way to look at this app without a device in hand.
 *
 * So this is not a shim that makes web a supported platform. It is a bench. It
 * holds everything in memory, forgets it on reload, and starts from a sample
 * list that looks like a real one, so screenshots and recordings show the app
 * as someone would actually meet it rather than empty.
 *
 * It must keep exporting exactly what `db.ts` exports, or the screens will fail
 * to build for web and this stops being useful.
 */

export type Prayer = {
  id: number;
  text: string;
  created_at: string; // ISO
  answered_at: string | null;
  prayed_count: number;
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

let prayers: Prayer[] = [];
let routine: { day: string; completed_at: string }[] = [];
let settings: Record<string, string> = {};
let nextId = 1;

const add = (text: string, created: number, prayed: number, answered: number | null) =>
  prayers.push({
    id: nextId++,
    text,
    created_at: daysAgo(created),
    answered_at: answered === null ? null : daysAgo(answered),
    prayed_count: prayed,
  });

export function initDb() {
  if (prayers.length) return;

  // An ordinary American list: family, neighbours, work, one that is hard to
  // say out loud. Nothing performative, nothing that reads as a demo.
  add('Dad’s scan on Thursday', 21, 19, null);
  add('The Millers next door — Ruth is not doing well', 46, 30, null);
  add('Patience with Emma. She is fifteen and I am tired.', 12, 11, null);
  add('That the shop makes rent this month', 9, 8, null);
  add('Marcus, that he calls his mother', 63, 22, null);
  add('Mom’s biopsy came back clear', 190, 74, 35);
  add('Jesse got the apprenticeship', 240, 61, 78);
  add('We found a church we can walk to', 300, 52, 122);

  // Twenty-one finished routines, with a gap in the middle because nobody's
  // month is unbroken. That lands on the young tree, which is the last stage
  // that has a real botanical plate — the tree planted by water still falls
  // back to the drawing, and the drawing is not something to put in a store
  // listing. Raise this once those two plates arrive.
  for (let i = 23; i >= 0; i--) {
    if (i === 12 || i === 13 || i === 19) continue;
    const d = new Date(Date.now() - i * 86400000);
    routine.push({ day: todayKey(d), completed_at: d.toISOString() });
  }
  settings.member_since = daysAgo(64);
  settings.reminder_time = '6:20';
}

export function listPrayers(): Prayer[] {
  return [...prayers].sort(
    (a, b) =>
      Number(!!a.answered_at) - Number(!!b.answered_at) ||
      b.created_at.localeCompare(a.created_at)
  );
}

export function activePrayers(): Prayer[] {
  return prayers.filter((p) => !p.answered_at).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function answeredPrayers(limit = 3): Prayer[] {
  return prayers
    .filter((p) => p.answered_at)
    .sort((a, b) => b.answered_at!.localeCompare(a.answered_at!))
    .slice(0, limit);
}

export function addPrayer(text: string) {
  add(text.trim(), 0, 0, null);
}

export function markAnswered(id: number, answered: boolean) {
  const p = prayers.find((x) => x.id === id);
  if (p) p.answered_at = answered ? new Date().toISOString() : null;
}

export function deletePrayer(id: number) {
  prayers = prayers.filter((p) => p.id !== id);
}

export function bumpPrayed(ids: number[]) {
  for (const p of prayers) if (ids.includes(p.id)) p.prayed_count += 1;
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function markRoutineDone() {
  const day = todayKey();
  if (!routine.some((r) => r.day === day)) routine.push({ day, completed_at: new Date().toISOString() });
}

export function routineDoneToday(): boolean {
  return routine.some((r) => r.day === todayKey());
}

export function routineCount(): number {
  return routine.length;
}

export function getSetting(key: string): string | null {
  return settings[key] ?? null;
}

export function setSetting(key: string, value: string | null) {
  if (value === null) delete settings[key];
  else settings[key] = value;
}

export function exportAll() {
  return {
    exported_at: new Date().toISOString(),
    app: 'Selah Daily',
    prayers: listPrayers(),
    routine_log: [...routine].sort((a, b) => a.day.localeCompare(b.day)),
  };
}

export function importAll(data: {
  prayers?: Prayer[];
  routine_log?: { day: string; completed_at: string }[];
}) {
  for (const p of data.prayers ?? []) {
    prayers.push({
      id: nextId++,
      text: p.text,
      created_at: p.created_at,
      answered_at: p.answered_at ?? null,
      prayed_count: p.prayed_count ?? 0,
    });
  }
  for (const r of data.routine_log ?? []) {
    if (!routine.some((x) => x.day === r.day)) routine.push(r);
  }
}

export function memberSince(): Date | null {
  const v = getSetting('member_since');
  return v ? new Date(v) : null;
}

export function markMemberSince(d = new Date()) {
  if (!getSetting('member_since')) setSetting('member_since', d.toISOString());
}
