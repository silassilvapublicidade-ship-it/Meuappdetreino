-- Biblioteca de vídeos de execução: uma por exercício, para todos os usuários.
-- Só quem está em video_editores (o Silas) cadastra ou muda os links.

create table public.video_editores (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.video_editores enable row level security;
create policy "editores: vê o próprio" on public.video_editores for select to authenticated using (user_id = auth.uid());
grant select on public.video_editores to authenticated;

create function public.sou_editor_videos()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.video_editores where user_id = auth.uid())
$$;

create table public.exercise_videos (
  chave text primary key check (char_length(chave) between 1 and 120),
  nome text not null check (char_length(nome) between 1 and 160),
  video text not null check (video ~ '^https?://' and char_length(video) <= 500),
  updated_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.exercise_videos enable row level security;
create policy "videos: todos leem" on public.exercise_videos for select to authenticated using (true);
create policy "videos: editor cria" on public.exercise_videos for insert to authenticated with check ((select public.sou_editor_videos()));
create policy "videos: editor muda" on public.exercise_videos for update to authenticated using ((select public.sou_editor_videos())) with check ((select public.sou_editor_videos()));
create policy "videos: editor remove" on public.exercise_videos for delete to authenticated using ((select public.sou_editor_videos()));
grant select, insert, update, delete on public.exercise_videos to authenticated;

-- Nomes dos exercícios das fichas da família (só para o editor), para ele cadastrar os vídeos
create function public.exercicios_da_familia()
returns table (nome text) language sql stable security definer set search_path = '' as $$
  select distinct trim(e->>'n')
  from public.plans p
  cross join lateral jsonb_each(coalesce(p.treinos->'w', '{}'::jsonb)) w(letra, t)
  cross join lateral jsonb_array_elements(coalesce(t->'ex', '[]'::jsonb)) e
  where public.sou_editor_videos()
    and (p.user_id = auth.uid() or public.compartilha_grupo(p.user_id::text))
    and coalesce(trim(e->>'n'), '') <> ''
$$;

revoke execute on function public.sou_editor_videos(), public.exercicios_da_familia() from public, anon;
grant execute on function public.sou_editor_videos(), public.exercicios_da_familia() to authenticated;

insert into public.video_editores (user_id) values ('181139ac-c1b3-488b-a95c-9c5d3165d388');
