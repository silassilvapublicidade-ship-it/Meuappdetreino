-- Fichas usadas junto (ex.: ficha do Renan + ficha de outro personal) e aviso de treino esquecido aberto
alter table public.plans add column if not exists extra boolean not null default false;
alter table public.profiles add column if not exists aviso_treino_aberto bigint;

create or replace function public.admin_salvar_ficha(p_user uuid, p_id uuid, p_nome text, p_treinos jsonb, p_cronograma jsonb)
returns public.plans language plpgsql security definer set search_path = '' as $$
declare r public.plans;
begin
  if not public.sou_admin() then raise exception 'sem_permissao'; end if;
  if p_id is not null then
    update public.plans set nome = p_nome, treinos = p_treinos, cronograma = p_cronograma, updated_at = now()
      where id = p_id and user_id = p_user returning * into r;
    if r.id is null then raise exception 'ficha_nao_encontrada'; end if;
  else
    -- a nova ficha vira a principal; fichas extras (usadas junto) continuam ativas
    update public.plans set ativa = false where user_id = p_user and ativa and not extra;
    insert into public.plans (user_id, nome, treinos, cronograma, ativa) values (p_user, p_nome, p_treinos, p_cronograma, true) returning * into r;
  end if;
  return r;
end;
$$;

create or replace function public.admin_ativar_ficha(p_user uuid, p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.sou_admin() then raise exception 'sem_permissao'; end if;
  -- troca a principal; fichas usadas junto continuam como estão
  update public.plans set ativa = (id = p_id), extra = case when id = p_id then false else extra end
    where user_id = p_user and (id = p_id or not extra);
end;
$$;
