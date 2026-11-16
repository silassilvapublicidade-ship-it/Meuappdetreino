-- Grupo da família: cada um vê só a FREQUÊNCIA dos outros (dias treinados), nunca cargas, medidas ou fotos de evolução.

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 40),
  codigo text not null unique,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- grupos de quem está chamando (usado nas regras de acesso)
create or replace function public.meus_grupos()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select group_id from public.group_members where user_id = auth.uid()
$$;

-- o usuário logado divide algum grupo com "outro"? (texto para servir também às regras de arquivos)
create or replace function public.compartilha_grupo(outro text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_members a
    join public.group_members b on b.group_id = a.group_id
    where a.user_id = auth.uid() and b.user_id::text = outro
  )
$$;

create policy "grupos: membros leem" on public.groups for select to authenticated
  using (id in (select public.meus_grupos()));
create policy "membros: membros leem" on public.group_members for select to authenticated
  using (group_id in (select public.meus_grupos()));

revoke all on public.groups, public.group_members from anon;
grant select on public.groups, public.group_members to authenticated;

-- foto de perfil visível para quem está no mesmo grupo
create policy "fotos: grupo vê foto de perfil" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and name ~ '/avatar-[0-9]+\.jpg$' and public.compartilha_grupo((storage.foldername(name))[1]));

-- criar grupo e entrar como primeiro membro
create or replace function public.criar_grupo(p_nome text)
returns public.groups language plpgsql security definer set search_path = '' as $$
declare g public.groups; c text; tentativa int := 0;
begin
  if auth.uid() is null then raise exception 'login necessário'; end if;
  loop
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when char_length(c) = 6 and not exists (select 1 from public.groups where codigo = c);
    tentativa := tentativa + 1;
    if tentativa > 20 then raise exception 'não consegui gerar o código'; end if;
  end loop;
  insert into public.groups (nome, codigo, created_by) values (left(coalesce(nullif(trim(p_nome), ''), 'Família'), 40), c, auth.uid()) returning * into g;
  insert into public.group_members (group_id, user_id) values (g.id, auth.uid());
  return g;
end;
$$;

-- entrar com o código do convite
create or replace function public.entrar_grupo(p_codigo text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'login necessário'; end if;
  select id into gid from public.groups where codigo = upper(trim(p_codigo));
  if gid is null then raise exception 'codigo_invalido'; end if;
  if (select count(*) from public.group_members where group_id = gid) >= 12 then raise exception 'grupo_cheio'; end if;
  insert into public.group_members (group_id, user_id) values (gid, auth.uid()) on conflict do nothing;
  return gid;
end;
$$;

-- sair (o grupo some quando o último sai)
create or replace function public.sair_grupo(p_grupo uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.group_members where group_id = p_grupo and user_id = auth.uid();
  delete from public.groups g where g.id = p_grupo and not exists (select 1 from public.group_members m where m.group_id = g.id);
end;
$$;

-- resumo do grupo: nome, foto, @ e dias treinados (últimos 400 dias) de cada membro
create or replace function public.grupo_resumo(p_grupo uuid)
returns table (user_id uuid, nome text, avatar_path text, instagram text, dias date[])
language sql stable security definer set search_path = '' as $$
  select m.user_id, p.nome, p.avatar_path, p.instagram,
    coalesce((select array_agg(distinct (s.started_at at time zone 'America/Sao_Paulo')::date order by (s.started_at at time zone 'America/Sao_Paulo')::date)
              from public.sessions s
              where s.user_id = m.user_id and s.started_at > now() - interval '400 days'), '{}')
  from public.group_members m
  left join public.profiles p on p.id = m.user_id
  where m.group_id = p_grupo
    and exists (select 1 from public.group_members eu where eu.group_id = p_grupo and eu.user_id = auth.uid())
  order by m.joined_at
$$;

revoke execute on function public.meus_grupos(), public.compartilha_grupo(text), public.criar_grupo(text), public.entrar_grupo(text), public.sair_grupo(uuid), public.grupo_resumo(uuid) from public, anon;
grant execute on function public.meus_grupos(), public.compartilha_grupo(text), public.criar_grupo(text), public.entrar_grupo(text), public.sair_grupo(uuid), public.grupo_resumo(uuid) to authenticated;
