-- Funções de gatilho não devem ser chamadas pela API
revoke execute on function public.criar_perfil() from public, anon, authenticated;
revoke execute on function public.tocar_updated_at() from public, anon, authenticated;
