-- Metas de composição corporal (no próprio perfil) e reações no grupo da família.

alter table public.profiles
  add column meta_peso numeric(5,1) check (meta_peso between 30 and 300),
  add column meta_gordura numeric(4,1) check (meta_gordura between 3 and 60),
  add column meta_data date;

create table public.group_reactions (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null default auth.uid() references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  dia date not null,
  emoji text not null check (emoji in ('👏','🔥','💪')),
  created_at timestamptz not null default now(),
  unique (from_user, to_user, dia, emoji),
  check (from_user <> to_user)
);
create index group_reactions_to_idx on public.group_reactions (to_user, dia);
alter table public.group_reactions enable row level security;
create policy "reacoes: grupo vê" on public.group_reactions for select to authenticated
  using (to_user = auth.uid() or from_user = auth.uid() or (select public.compartilha_grupo(to_user::text)));
create policy "reacoes: manda para o grupo" on public.group_reactions for insert to authenticated
  with check (from_user = auth.uid() and (select public.compartilha_grupo(to_user::text)));
create policy "reacoes: tira a própria" on public.group_reactions for delete to authenticated using (from_user = auth.uid());
grant select, insert, delete on public.group_reactions to authenticated;
