-- Meus Treinos: estrutura inicial
-- Cada pessoa só lê e grava os próprios dados (RLS por auth.uid()).

-- ---------- Perfis ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  created_at timestamptz not null default now()
);

create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, nullif(new.raw_user_meta_data ->> 'nome', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- ---------- Fichas ----------
-- treinos: {"order":["A","B",...],"w":{"A":{"name","focus","rest","ex":[{n,parts,bi,s,r:[min,max],rest,inc,tip}]}}}
-- cronograma: {"0":"total","1":"A","2":"B","3":"ativo",...}  (chave = dia da semana, 0 = domingo)
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null default 'Minha ficha',
  treinos jsonb not null,
  cronograma jsonb not null default '{}'::jsonb,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index plans_user_idx on public.plans (user_id);

create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger plans_updated_at
  before update on public.plans
  for each row execute function public.tocar_updated_at();

-- ---------- Treinos realizados ----------
create table public.sessions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  letter text not null,
  workout_name text,
  started_at timestamptz not null,
  ended_at timestamptz,
  dur_s integer,
  notes text,
  ex jsonb not null default '[]'::jsonb,
  vol integer not null default 0,
  sets_done integer not null default 0,
  sets_total integer not null default 0,
  created_at timestamptz not null default now()
);
create index sessions_user_started_idx on public.sessions (user_id, started_at desc);
create index sessions_plan_idx on public.sessions (plan_id);

-- ---------- Treino em andamento ----------
create table public.drafts (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- Peso corporal ----------
create table public.body_weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  d date not null,
  kg numeric(6,2) not null check (kg > 0 and kg < 500),
  created_at timestamptz not null default now(),
  unique (user_id, d)
);

-- ---------- Avaliações físicas ----------
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  d date not null,
  src text not null default 'manual' check (src in ('avaliacao', 'manual')),
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index assessments_user_idx on public.assessments (user_id, d);

-- ---------- Fotos de evolução ----------
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  d date not null,
  pose text not null check (pose in ('frente', 'lado', 'costas')),
  path text not null,
  created_at timestamptz not null default now(),
  unique (user_id, d, pose)
);

-- ---------- Acesso: só o dono ----------
alter table public.profiles     enable row level security;
alter table public.plans        enable row level security;
alter table public.sessions     enable row level security;
alter table public.drafts       enable row level security;
alter table public.body_weights enable row level security;
alter table public.assessments  enable row level security;
alter table public.photos       enable row level security;

create policy "perfil: dono lê"      on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "perfil: dono altera"  on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "perfil: dono cria"    on public.profiles for insert to authenticated with check (id = (select auth.uid()));

create policy "fichas: dono"     on public.plans        for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "treinos: dono"    on public.sessions     for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "rascunho: dono"   on public.drafts       for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "peso: dono"       on public.body_weights for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "avaliacoes: dono" on public.assessments  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "fotos: dono"      on public.photos       for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Visitantes sem login não acessam nada
revoke all on public.profiles, public.plans, public.sessions, public.drafts, public.body_weights, public.assessments, public.photos from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.plans, public.sessions, public.drafts, public.body_weights, public.assessments, public.photos to authenticated;

-- ---------- Armazenamento das fotos (privado, pasta por usuário) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "fotos: dono lê arquivos" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "fotos: dono envia arquivos" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "fotos: dono troca arquivos" on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "fotos: dono apaga arquivos" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);
