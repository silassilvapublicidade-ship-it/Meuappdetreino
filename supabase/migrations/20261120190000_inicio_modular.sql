-- Tela de início personalizável: ordem dos módulos, ocultos, compacto/completo e organização pela hora
alter table public.profiles add column if not exists inicio jsonb;
alter table public.profiles drop constraint if exists profiles_inicio_tam;
alter table public.profiles add constraint profiles_inicio_tam check (inicio is null or (jsonb_typeof(inicio) = 'object' and pg_column_size(inicio) < 4000));
