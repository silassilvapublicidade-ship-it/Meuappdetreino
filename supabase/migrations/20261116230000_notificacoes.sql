-- Notificações no celular (Web Push)
-- * push_subs: cada aparelho que ativou as notificações
-- * profiles.notif: o que a pessoa quer receber; profiles.lembrete_hora: hora do lembrete nos dias de treino
-- * gatilhos em sessions e group_reactions chamam a função "notificar"
-- * pg_cron chama a função a cada 5 minutos para os lembretes
-- As chaves (VAPID e a chave interna dos gatilhos) ficam no Vault, nunca no código.

create extension if not exists pg_net;
create extension if not exists pg_cron;

create table if not exists public.push_subs (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  ua text,
  created_at timestamptz not null default now()
);
create index if not exists push_subs_user_idx on public.push_subs (user_id);
alter table public.push_subs enable row level security;
create policy "push: dono lê" on public.push_subs for select to authenticated using (user_id = auth.uid());
create policy "push: dono grava" on public.push_subs for insert to authenticated with check (user_id = auth.uid());
create policy "push: dono atualiza" on public.push_subs for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "push: dono apaga" on public.push_subs for delete to authenticated using (user_id = auth.uid());
revoke all on public.push_subs from anon;
grant select, insert, update, delete on public.push_subs to authenticated;

alter table public.profiles
  add column if not exists notif jsonb not null default '{"grupo": true, "reacoes": true, "lembrete": true}'::jsonb,
  add column if not exists lembrete_hora time,
  add column if not exists lembrete_ultimo date;

-- ---------- chaves no Vault (só o servidor lê) ----------
-- chave pública VAPID: o app precisa dela para assinar as notificações (não é segredo)
create or replace function public.vapid_publica()
returns text language sql stable security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'vapid_publica' limit 1
$$;
revoke execute on function public.vapid_publica() from public, anon;
grant execute on function public.vapid_publica() to authenticated;

-- usadas só pela função "notificar" (com a chave de serviço)
create or replace function public.notif_segredos()
returns table (chave_interna text, vapid_publica text, vapid_privada text)
language sql stable security definer set search_path = '' as $$
  select
    (select decrypted_secret from vault.decrypted_secrets where name = 'notif_chave' limit 1),
    (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_publica' limit 1),
    (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_privada' limit 1)
$$;
create or replace function public.notif_guardar_vapid(p_publica text, p_privada text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from vault.secrets where name = 'vapid_publica') then return; end if;
  perform vault.create_secret(p_publica, 'vapid_publica', 'Chave pública VAPID (notificações)');
  perform vault.create_secret(p_privada, 'vapid_privada', 'Chave privada VAPID (notificações)');
end;
$$;
revoke execute on function public.notif_segredos(), public.notif_guardar_vapid(text, text) from public, anon, authenticated;
grant execute on function public.notif_segredos(), public.notif_guardar_vapid(text, text) to service_role;

-- chave interna gerada aqui mesmo (os gatilhos mandam, a função confere)
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'notif_chave') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'notif_chave', 'Chave interna gatilhos -> função notificar');
  end if;
end $$;

-- ---------- chamada à função ----------
create or replace function public.notif_chamar(p_corpo jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare k text;
begin
  select decrypted_secret into k from vault.decrypted_secrets where name = 'notif_chave' limit 1;
  if k is null then return; end if;
  perform net.http_post(
    url := 'https://fiewzckxrqaprybzynoc.supabase.co/functions/v1/notificar',
    body := p_corpo,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-chave', k),
    timeout_milliseconds := 8000
  );
exception when others then
  -- notificação nunca pode impedir salvar o treino
  null;
end;
$$;
revoke execute on function public.notif_chamar(jsonb) from public, anon, authenticated;

create or replace function public.notif_ao_salvar_treino()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.started_at > now() - interval '12 hours' then
    perform public.notif_chamar(jsonb_build_object('tipo', 'treino', 'id', new.id));
  end if;
  return new;
end;
$$;
create or replace function public.notif_ao_reagir()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.notif_chamar(jsonb_build_object('tipo', 'reacao', 'id', new.id));
  return new;
end;
$$;
revoke execute on function public.notif_ao_salvar_treino(), public.notif_ao_reagir() from public, anon, authenticated;

drop trigger if exists notif_treino on public.sessions;
create trigger notif_treino after insert on public.sessions for each row execute function public.notif_ao_salvar_treino();
drop trigger if exists notif_reacao on public.group_reactions;
create trigger notif_reacao after insert on public.group_reactions for each row execute function public.notif_ao_reagir();

-- lembretes: a cada 5 minutos
select cron.unschedule(jobid) from cron.job where jobname = 'notif-lembretes';
select cron.schedule('notif-lembretes', '*/5 * * * *', $$ select public.notif_chamar('{"tipo":"lembretes"}'::jsonb) $$);
