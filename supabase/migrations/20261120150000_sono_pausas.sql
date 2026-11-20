-- Despertares no meio da noite: lista de {ini, fim} (ISO), descontados do sono real
alter table public.sono add column if not exists pausas jsonb not null default '[]'::jsonb;
alter table public.sono drop constraint if exists sono_pausas_lista;
alter table public.sono add constraint sono_pausas_lista check (jsonb_typeof(pausas) = 'array' and jsonb_array_length(pausas) <= 10);
