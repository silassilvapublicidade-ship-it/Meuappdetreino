-- Área do admin: visão geral, usuários, fichas de outros usuários, avisos e registro de erros.
-- O admin não vê peso, medidas nem fotos de ninguém: só contagens e fichas de treino.

create table public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.app_admins enable row level security;
create policy "admins: vê o próprio" on public.app_admins for select to authenticated using (user_id = auth.uid());
grant select on public.app_admins to authenticated;

create function public.sou_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid())
$$;

-- o admin também edita a biblioteca de vídeos
create or replace function public.sou_editor_videos()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.video_editores where user_id = auth.uid())
      or exists (select 1 from public.app_admins where user_id = auth.uid())
$$;

-- ---------- Avisos para todos (aparecem na tela Hoje) ----------
create table public.app_avisos (
  id uuid primary key default gen_random_uuid(),
  texto text not null check (char_length(texto) between 1 and 400),
  nivel text not null default 'info' check (nivel in ('info','alerta','festa')),
  ativo boolean not null default true,
  expira_em timestamptz,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.app_avisos enable row level security;
create policy "avisos: todos leem os ativos" on public.app_avisos for select to authenticated
  using ((ativo and (expira_em is null or expira_em > now())) or (select public.sou_admin()));
create policy "avisos: admin cria" on public.app_avisos for insert to authenticated with check ((select public.sou_admin()));
create policy "avisos: admin muda" on public.app_avisos for update to authenticated using ((select public.sou_admin())) with check ((select public.sou_admin()));
create policy "avisos: admin remove" on public.app_avisos for delete to authenticated using ((select public.sou_admin()));
grant select, insert, update, delete on public.app_avisos to authenticated;

-- ---------- Erros do app (cada aparelho registra; só o admin lê) ----------
create table public.app_erros (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  msg text not null check (char_length(msg) <= 500),
  detalhe text check (char_length(detalhe) <= 2000),
  tela text check (char_length(tela) <= 60),
  versao text check (char_length(versao) <= 40),
  aparelho text check (char_length(aparelho) <= 300),
  created_at timestamptz not null default now()
);
create index app_erros_created_idx on public.app_erros (created_at desc);
alter table public.app_erros enable row level security;
create policy "erros: cada um registra os seus" on public.app_erros for insert to authenticated with check (user_id = auth.uid());
create policy "erros: admin lê" on public.app_erros for select to authenticated using ((select public.sou_admin()));
create policy "erros: admin limpa" on public.app_erros for delete to authenticated using ((select public.sou_admin()));
grant select, insert, delete on public.app_erros to authenticated;

-- ---------- Visão geral ----------
create function public.admin_resumo()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.sou_admin() then raise exception 'sem_permissao'; end if;
  return jsonb_build_object(
    'usuarios', (select count(*) from auth.users),
    'treinos', (select count(*) from public.sessions),
    'treinos_7d', (select count(*) from public.sessions where started_at > now() - interval '7 days'),
    'treinos_30d', (select count(*) from public.sessions where started_at > now() - interval '30 days'),
    'ativos_7d', (select count(distinct user_id) from public.sessions where started_at > now() - interval '7 days'),
    'fichas', (select count(*) from public.plans),
    'avaliacoes', (select count(*) from public.assessments),
    'fotos', (select count(*) from storage.objects where bucket_id = 'fotos'),
    'fotos_mb', round(coalesce((select sum((metadata->>'size')::bigint) from storage.objects where bucket_id = 'fotos'), 0) / 1048576.0, 1),
    'grupos', (select count(*) from public.groups),
    'videos', (select count(*) from public.exercise_videos),
    'erros_24h', (select count(*) from public.app_erros where created_at > now() - interval '24 hours'),
    'erros_7d', (select count(*) from public.app_erros where created_at > now() - interval '7 days'),
    'agora', now()
  );
end;
$$;

create function public.admin_usuarios()
returns table (user_id uuid, nome text, email text, criado_em timestamptz, ultimo_login timestamptz, confirmado boolean,
               treinos bigint, treinos_30d bigint, ultimo_treino timestamptz, ficha text, admin boolean, grupo text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.sou_admin() then raise exception 'sem_permissao'; end if;
  return query
  select u.id, p.nome, u.email::text, u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null,
    (select count(*) from public.sessions s where s.user_id = u.id),
    (select count(*) from public.sessions s where s.user_id = u.id and s.started_at > now() - interval '30 days'),
    (select max(s.started_at) from public.sessions s where s.user_id = u.id),
    (select pl.nome from public.plans pl where pl.user_id = u.id and pl.ativa order by pl.updated_at desc limit 1),
    exists (select 1 from public.app_admins a where a.user_id = u.id),
    (select g.nome from public.group_members m join public.groups g on g.id = m.group_id where m.user_id = u.id order by m.joined_at limit 1)
  from auth.users u left join public.profiles p on p.id = u.id
  order by u.created_at;
end;
$$;

-- ---------- Fichas de outro usuário (ver e editar) ----------
create function public.admin_fichas(p_user uuid)
returns setof public.plans language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.sou_admin() then raise exception 'sem_permissao'; end if;
  return query select * from public.plans where user_id = p_user order by created_at;
end;
$$;

create function public.admin_salvar_ficha(p_user uuid, p_id uuid, p_nome text, p_treinos jsonb, p_cronograma jsonb)
returns public.plans language plpgsql security definer set search_path = '' as $$
declare r public.plans;
begin
  if not public.sou_admin() then raise exception 'sem_permissao'; end if;
  if p_id is not null then
    update public.plans set nome = p_nome, treinos = p_treinos, cronograma = p_cronograma, updated_at = now()
      where id = p_id and user_id = p_user returning * into r;
    if r.id is null then raise exception 'ficha_nao_encontrada'; end if;
  else
    update public.plans set ativa = false where user_id = p_user and ativa;
    insert into public.plans (user_id, nome, treinos, cronograma, ativa) values (p_user, p_nome, p_treinos, p_cronograma, true) returning * into r;
  end if;
  return r;
end;
$$;

create function public.admin_ativar_ficha(p_user uuid, p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.sou_admin() then raise exception 'sem_permissao'; end if;
  update public.plans set ativa = (id = p_id) where user_id = p_user;
end;
$$;

revoke execute on function public.sou_admin(), public.admin_resumo(), public.admin_usuarios(), public.admin_fichas(uuid),
  public.admin_salvar_ficha(uuid, uuid, text, jsonb, jsonb), public.admin_ativar_ficha(uuid, uuid) from public, anon;
grant execute on function public.sou_admin(), public.admin_resumo(), public.admin_usuarios(), public.admin_fichas(uuid),
  public.admin_salvar_ficha(uuid, uuid, text, jsonb, jsonb), public.admin_ativar_ficha(uuid, uuid) to authenticated;

insert into public.app_admins (user_id) values ('181139ac-c1b3-488b-a95c-9c5d3165d388');
