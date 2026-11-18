-- Avisos do admin também viram notificação no celular (quando marcado)
alter table public.app_avisos add column if not exists notificar boolean not null default true;

create or replace function public.notif_ao_publicar_aviso()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.notificar and new.ativo then
    perform public.notif_chamar(jsonb_build_object('tipo', 'aviso', 'id', new.id));
  end if;
  return new;
end;
$$;
revoke execute on function public.notif_ao_publicar_aviso() from public, anon, authenticated;

drop trigger if exists notif_aviso on public.app_avisos;
create trigger notif_aviso after insert on public.app_avisos for each row execute function public.notif_ao_publicar_aviso();
