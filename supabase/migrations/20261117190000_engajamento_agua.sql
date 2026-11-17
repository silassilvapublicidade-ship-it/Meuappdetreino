-- Engajamento: missões cumpridas (pontos), tema escolhido, meta de água e registro de água por dia.

alter table public.profiles
  add column if not exists missoes jsonb not null default '[]'::jsonb,
  add column if not exists tema text,
  add column if not exists agua_meta integer check (agua_meta is null or agua_meta between 500 and 8000);

create table if not exists public.agua (
  user_id uuid not null references auth.users(id) on delete cascade,
  dia date not null,
  ml integer not null default 0 check (ml between 0 and 20000),
  updated_at timestamptz not null default now(),
  primary key (user_id, dia)
);
alter table public.agua enable row level security;

drop policy if exists "agua: dono vê" on public.agua;
create policy "agua: dono vê" on public.agua for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "agua: dono cria" on public.agua;
create policy "agua: dono cria" on public.agua for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "agua: dono altera" on public.agua;
create policy "agua: dono altera" on public.agua for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "agua: dono apaga" on public.agua;
create policy "agua: dono apaga" on public.agua for delete to authenticated using ((select auth.uid()) = user_id);

-- Resumo da semana: domingo às 19h (Brasília) = 22h UTC
select cron.unschedule('notif-resumo') where exists (select 1 from cron.job where jobname = 'notif-resumo');
select cron.schedule('notif-resumo', '0 22 * * 0', $$ select public.notif_chamar('{"tipo":"resumo"}'::jsonb) $$);
