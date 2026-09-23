-- Run once in the Supabase SQL editor (browser client needs anon access to public.rooms).

grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.rooms to anon, authenticated;

alter table public.rooms enable row level security;

drop policy if exists "rooms_anon_select" on public.rooms;
create policy "rooms_anon_select"
on public.rooms
for select
to anon, authenticated
using (true);

drop policy if exists "rooms_anon_insert" on public.rooms;
create policy "rooms_anon_insert"
on public.rooms
for insert
to anon, authenticated
with check (true);

drop policy if exists "rooms_anon_update" on public.rooms;
create policy "rooms_anon_update"
on public.rooms
for update
to anon, authenticated
using (true)
with check (true);
