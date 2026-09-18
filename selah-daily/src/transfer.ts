/**
 * Moving a prayer list from an old phone to a new one, without an account.
 *
 * Selah Daily has no sign-in and no server-side copy of anything. A transfer is
 * the one exception, and it is built so the exception stays narrow:
 *
 *   1. The old phone makes a random 10-character code.
 *   2. Two different SHA-256 hashes come off that code — one is the row id the
 *      server stores under, the other is the AES-256 key. The server is handed
 *      the id and the ciphertext and never sees the code or the key.
 *   3. The new phone types the code, derives the same two hashes, asks for the
 *      row, and decrypts it locally.
 *   4. The server deletes the row the moment it is claimed, and in any case
 *      after 24 hours.
 *
 * The code is 10 characters from a 32-letter alphabet: about 2^50 possibilities.
 * There is no way to list rows — the table is closed to the anon role and the
 * only way in is a function that takes an exact id — so guessing means guessing
 * online, one HTTPS round trip at a time. 2^50 of those is not a real attack.
 *
 * If either Supabase setting below is blank the whole feature hides itself and
 * the file export in Settings is the way across. That is deliberate: a build
 * with no server configured genuinely never touches one.
 */
import * as Crypto from 'expo-crypto';
import { AESEncryptionKey, AESSealedData, aesEncryptAsync, aesDecryptAsync } from 'expo-crypto';
import { base64ToUtf8, utf8ToBase64 } from './base64';
import { exportAll, importAll, type Prayer } from './db';
import { config } from './theme';

/** Crockford base32: no I, L, O or U, so nothing reads as another character. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH = 10;

export const transferEnabled = !!config.supabaseUrl && !!config.supabaseAnonKey;

/** A fresh code, grouped for reading aloud: `K7QP-M2XD-4R`. */
export function newTransferCode(): string {
  const bytes = Crypto.getRandomBytes(CODE_LENGTH);
  let raw = '';
  // Rejection-free: 256 is 8 x 32, so a byte maps onto the alphabet evenly.
  for (let i = 0; i < CODE_LENGTH; i++) raw += ALPHABET[bytes[i] % ALPHABET.length];
  return format(raw);
}

export function format(raw: string): string {
  const c = raw.toUpperCase();
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 10)}`.replace(/-+$/, '');
}

/**
 * What the person typed, turned back into the ten characters.
 * Lower case, spaces and dashes are forgiven, and the four letters the alphabet
 * leaves out are folded onto the digits they are mistaken for.
 */
export function normalize(input: string): string {
  return input
    .toUpperCase()
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/U/g, 'V')
    .split('')
    .filter((ch) => ALPHABET.includes(ch))
    .join('')
    .slice(0, CODE_LENGTH);
}

export const isComplete = (input: string) => normalize(input).length === CODE_LENGTH;

const sha256 = (s: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, s, {
    encoding: Crypto.CryptoEncoding.HEX,
  });

/** Separate prefixes, so the id can never be turned back into the key. */
const rowIdFor = (code: string) => sha256(`selah-daily/transfer/id/v1:${code}`);
const keyHexFor = (code: string) => sha256(`selah-daily/transfer/key/v1:${code}`);

export type TransferPayload = {
  v: 1;
  exported_at: string;
  prayers: Prayer[];
  routine_log: { day: string; completed_at: string }[];
};

async function rpc<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`transfer/${fn} ${res.status}`);
  return (await res.json()) as T;
}

/**
 * Seal this phone's prayers under a fresh code and hand the ciphertext to the
 * server. Returns the code to read out or type into the new phone.
 */
export async function createTransfer(): Promise<{ code: string; count: number }> {
  const code = newTransferCode();
  const raw = normalize(code);
  const data = exportAll();
  const payload: TransferPayload = {
    v: 1,
    exported_at: data.exported_at,
    prayers: data.prayers,
    routine_log: data.routine_log,
  };

  const key = await AESEncryptionKey.import(await keyHexFor(raw), 'hex');
  const sealed = await aesEncryptAsync(utf8ToBase64(JSON.stringify(payload)), key);
  const blob = (await sealed.combined('base64')) as string;

  await rpc('create_transfer', { p_id: await rowIdFor(raw), p_payload: blob });
  return { code, count: payload.prayers.length };
}

export class TransferError extends Error {
  constructor(public kind: 'not-found' | 'bad-code' | 'network') {
    super(kind);
  }
}

/**
 * Claim a code: fetch the sealed blob, decrypt it here, and add everything to
 * this phone's list. Nothing already on this phone is removed — a transfer only
 * ever adds, so running it twice by mistake is survivable.
 */
export async function claimTransfer(input: string): Promise<{ prayers: number; days: number }> {
  const raw = normalize(input);
  if (raw.length !== CODE_LENGTH) throw new TransferError('bad-code');

  let blob: string | null;
  try {
    blob = await rpc<string | null>('claim_transfer', { p_id: await rowIdFor(raw) });
  } catch {
    throw new TransferError('network');
  }
  if (!blob) throw new TransferError('not-found');

  let payload: TransferPayload;
  try {
    const key = await AESEncryptionKey.import(await keyHexFor(raw), 'hex');
    const plain = (await aesDecryptAsync(AESSealedData.fromCombined(blob), key, {
      output: 'base64',
    })) as string;
    payload = JSON.parse(base64ToUtf8(plain));
  } catch {
    // The row existed but will not open: the code was mistyped into another
    // valid-looking code, or the blob is not ours.
    throw new TransferError('bad-code');
  }

  importAll(payload);
  return { prayers: payload.prayers?.length ?? 0, days: payload.routine_log?.length ?? 0 };
}
