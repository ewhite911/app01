# Transfer backend

Everything Selah Daily keeps is on the phone. This is the one exception, and it
is built to stay small: a sealed blob that lives for a day and is deleted the
moment the new phone reads it.

## Setting it up

1. Supabase dashboard → **SQL Editor** → New query → paste `schema.sql` → Run.
2. **Project Settings → API**. Copy the **Project URL** and the **anon public**
   key into `src/theme.ts`:

   ```ts
   supabaseUrl: 'https://xxxxxxxxxxxx.supabase.co',
   supabaseAnonKey: 'eyJhbGciOi...',
   ```

   Leave either one blank and the feature disappears from the app — no screen,
   no network call. The file export in Settings still moves a list across.

3. The `service_role` key is never used by the app. Do not put it in the repo.

## What the server can and cannot see

It holds two things: a 64-character hex id and a base64 blob. The id is
`sha256('selah-daily/transfer/id/v1:' || code)`. The AES-256-GCM key is
`sha256('selah-daily/transfer/key/v1:' || code)` and is derived on the phone —
it is never sent. Different prefixes, so one hash can never be turned into the
other. Reading the database gives you ciphertext and nothing else.

The table is closed to `anon` and RLS is on with no policies. The only way in is
`create_transfer` and `claim_transfer`, and both demand an exact id. No call
returns more than one row, so there is no listing to walk.

## The code

Ten characters from a 32-letter alphabet — Crockford base32, which drops I, L,
O and U so nothing reads as something else. About 2^50 codes. Guessing one means
guessing it online, one HTTPS round trip at a time, against a row that expires
in 24 hours and vanishes on first read.

## Keeping an eye on it

The anon key ships inside the app, so anyone can call `create_transfer`. The
1 MB payload cap and the 24-hour sweep are what keep that from mattering — the
table can only ever hold a day of writes. If it grows past what a day of real
use should look like, turn on Supabase's rate limiting for the REST endpoint.

Check the size now and then:

```sql
select count(*), pg_size_pretty(pg_total_relation_size('public.transfers'))
from public.transfers;
```
