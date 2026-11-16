-- Treino em grupo ao vivo: quem do grupo está treinando agora e quais exercícios já terminou.
-- Mostra só nome do treino, nome dos exercícios e quantas séries foram feitas. Nunca cargas.
create or replace function public.grupo_ao_vivo(p_grupo uuid)
returns table (user_id uuid, letra text, treino text, inicio timestamptz, atualizado timestamptz, exercicios jsonb, terminou timestamptz, terminou_letra text)
language sql stable security definer set search_path = '' as $$
  select m.user_id,
    case when d.updated_at > now() - interval '40 minutes' then d.data->>'letter' end,
    case when d.updated_at > now() - interval '40 minutes' then d.data->'w'->>'name' end,
    case when d.updated_at > now() - interval '40 minutes' then to_timestamp(((d.data->>'start')::bigint) / 1000.0) end,
    case when d.updated_at > now() - interval '40 minutes' then d.updated_at end,
    case when d.updated_at > now() - interval '40 minutes' then (
      select coalesce(jsonb_agg(jsonb_build_object(
          'n', we.e->>'n',
          'f', (select count(*) from jsonb_array_elements(de.e->'sets') s where coalesce((s->>'done')::boolean, false)),
          't', jsonb_array_length(coalesce(de.e->'sets', '[]'::jsonb))
        ) order by we.i), '[]'::jsonb)
      from jsonb_array_elements(d.data->'w'->'ex') with ordinality we(e, i)
      join jsonb_array_elements(d.data->'ex') with ordinality de(e, i) on de.i = we.i
    ) end,
    s.started_at + make_interval(secs => coalesce(s.dur_s, 0)),
    s.letter
  from public.group_members m
  left join public.drafts d on d.user_id = m.user_id
  left join lateral (
    select x.started_at, x.dur_s, x.letter from public.sessions x
    where x.user_id = m.user_id and x.started_at > now() - interval '6 hours'
    order by x.started_at desc limit 1
  ) s on true
  where m.group_id = p_grupo
    and exists (select 1 from public.group_members eu where eu.group_id = p_grupo and eu.user_id = auth.uid())
$$;

revoke execute on function public.grupo_ao_vivo(uuid) from public, anon;
grant execute on function public.grupo_ao_vivo(uuid) to authenticated;
