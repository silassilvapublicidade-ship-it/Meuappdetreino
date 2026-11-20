-- Sono v2: hora de acordar (para a hora ideal de deitar), controle dos avisos e cochilos
alter table public.profiles
  add column if not exists sono_acordar text check (sono_acordar is null or sono_acordar ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  add column if not exists sono_deitar_ultimo date,
  add column if not exists sono_manha_ultimo date;

create table if not exists public.sono_cochilos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dia date not null,
  ini timestamptz not null,
  fim timestamptz not null,
  created_at timestamptz not null default now(),
  check (fim > ini and fim - ini <= interval '4 hours')
);
create index if not exists sono_cochilos_user_dia on public.sono_cochilos (user_id, dia);
alter table public.sono_cochilos enable row level security;
drop policy if exists "cochilos: dono vê" on public.sono_cochilos;
create policy "cochilos: dono vê" on public.sono_cochilos for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "cochilos: dono cria" on public.sono_cochilos;
create policy "cochilos: dono cria" on public.sono_cochilos for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "cochilos: dono apaga" on public.sono_cochilos;
create policy "cochilos: dono apaga" on public.sono_cochilos for delete to authenticated using ((select auth.uid()) = user_id);
