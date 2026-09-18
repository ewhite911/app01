-- Selah Daily — phone-to-phone transfer
--
-- Run this once in the Supabase SQL editor (Dashboard > SQL Editor > New query).
-- It is safe to run again: every statement is idempotent.
--
-- The design in one line: the anon role cannot touch the table at all, and the
-- only way in is two functions that each take an exact 64-character id. There
-- is no query that returns more than one row, so there is nothing to enumerate.

create table if not exists public.transfers (
  -- sha256('selah-daily/transfer/id/v1:' || code), hex. Never the code itself.
  id          text        primary key,
  -- AES-256-GCM, IV + ciphertext + tag, base64. The key is derived from the
  -- code on the phone and is never sent here.
  payload     text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists transfers_created_at_idx on public.transfers (created_at);

-- Row level security with no policies at all: PostgREST can reach the table
-- through a security-definer function and no other way.
alter table public.transfers enable row level security;
revoke all on public.transfers from anon, authenticated;

-- How long a sealed transfer survives unread. Keep this in step with
-- config.transferHours in src/theme.ts.
create or replace function public.transfer_ttl() returns interval
language sql immutable as $$ select interval '24 hours' $$;

-- Opportunistic sweep. There is no cron dependency: every call clears what has
-- expired, and the table only ever holds transfers from the last day.
create or replace function public.sweep_transfers() returns void
language sql security definer set search_path = '' as $$
  delete from public.transfers where created_at < now() - public.transfer_ttl();
$$;

create or replace function public.create_transfer(p_id text, p_payload text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_id !~ '^[0-9a-f]{64}$' then
    raise exception 'bad id';
  end if;
  -- A prayer list is a few kilobytes. The cap is what stops the table being
  -- used as free file storage by anyone who reads the anon key out of the app.
  if p_payload is null or length(p_payload) > 1048576 then
    raise exception 'bad payload';
  end if;

  perform public.sweep_transfers();

  insert into public.transfers (id, payload, created_at)
  values (p_id, p_payload, now())
  on conflict (id) do update set payload = excluded.payload, created_at = now();
end;
$$;

-- Returns the sealed blob and deletes it in the same statement, so a code is
-- good for exactly one phone. A miss returns null rather than raising: the
-- caller cannot tell an expired code from one that never existed.
create or replace function public.claim_transfer(p_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payload text;
begin
  if p_id !~ '^[0-9a-f]{64}$' then
    return null;
  end if;

  perform public.sweep_transfers();

  delete from public.transfers
  where id = p_id and created_at >= now() - public.transfer_ttl()
  returning payload into v_payload;

  return v_payload;
end;
$$;

revoke all on function public.sweep_transfers() from public, anon, authenticated;
revoke all on function public.create_transfer(text, text) from public;
revoke all on function public.claim_transfer(text) from public;
grant execute on function public.create_transfer(text, text) to anon, authenticated;
grant execute on function public.claim_transfer(text) to anon, authenticated;
