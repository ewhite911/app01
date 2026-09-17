import verses from './data/verses.json';

export type Verse = { day: number; ref: string; text: string };

const list = verses as Verse[];

/** Day-of-year (1..366) → one verse. Public-domain Berean Standard Bible text, unchanged. */
export function verseForToday(d = new Date()): Verse {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000); // 1..366
  const idx = (dayOfYear - 1) % list.length;
  return list[idx];
}
