-- Noite em andamento ("Vou dormir") guardada na conta, para funcionar em qualquer aparelho
alter table public.profiles add column if not exists sono_aberta jsonb;
alter table public.profiles drop constraint if exists profiles_sono_aberta_tam;
alter table public.profiles add constraint profiles_sono_aberta_tam check (sono_aberta is null or (jsonb_typeof(sono_aberta) = 'object' and pg_column_size(sono_aberta) < 2000));
