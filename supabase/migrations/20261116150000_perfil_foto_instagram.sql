-- Foto de perfil (no bucket privado "fotos", pasta do usuário) e @ do Instagram
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists instagram text check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$');
