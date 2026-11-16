-- Lista de usuários do admin com foto e @; admin pode ver as fotos de perfil.
create function public.admin_usuarios_v2()
returns table (user_id uuid, nome text, email text, avatar_path text, instagram text, criado_em timestamptz, ultimo_login timestamptz, confirmado boolean,
               treinos bigint, treinos_30d bigint, ultimo_treino timestamptz, ficha text, admin boolean, grupo text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.sou_admin() then raise exception 'sem_permissao'; end if;
  return query
  select u.id, p.nome, u.email::text, p.avatar_path, p.instagram, u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null,
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
revoke execute on function public.admin_usuarios_v2() from public, anon;
grant execute on function public.admin_usuarios_v2() to authenticated;

create policy "fotos: admin vê foto de perfil" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and name ~ '/avatar-[0-9]+\.jpg$' and (select public.sou_admin()));
