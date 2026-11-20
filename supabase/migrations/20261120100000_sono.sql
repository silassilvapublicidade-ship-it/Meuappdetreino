-- Registro de sono: uma noite por dia (o dia em que a pessoa acordou)
create table if not exists public.sono (
  user_id uuid not null references auth.users(id) on delete cascade,
  dia date not null,
  dormiu timestamptz not null,
  acordou timestamptz not null,
  qualidade smallint check (qualidade between 1 and 5),
  obs text check (char_length(obs) <= 300),
  updated_at timestamptz not null default now(),
  primary key (user_id, dia),
  check (acordou > dormiu and acordou - dormiu <= interval '20 hours')
);
alter table public.sono enable row level security;

drop policy if exists "sono: dono vê" on public.sono;
create policy "sono: dono vê" on public.sono for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "sono: dono cria" on public.sono;
create policy "sono: dono cria" on public.sono for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "sono: dono altera" on public.sono;
create policy "sono: dono altera" on public.sono for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "sono: dono apaga" on public.sono;
create policy "sono: dono apaga" on public.sono for delete to authenticated using ((select auth.uid()) = user_id);

alter table public.profiles add column if not exists sono_meta integer check (sono_meta is null or sono_meta between 240 and 720);
