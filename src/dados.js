// Camada de dados: Supabase (login, banco, fotos e leitura de documentos).
import { createClient } from '@supabase/supabase-js';

const URL_SB = import.meta.env.VITE_SUPABASE_URL;
const CHAVE = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const configurado = !!(URL_SB && CHAVE);
export const sb = configurado ? createClient(URL_SB, CHAVE, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;

function ok({ data, error }){ if(error) throw error; return data; }

// ---------- Conversões ----------
export function linhaParaTreino(r){
  return {
    id: r.id, planId: r.plan_id, letter: r.letter, wname: r.workout_name || '',
    start: Date.parse(r.started_at), end: r.ended_at ? Date.parse(r.ended_at) : null,
    dur: r.dur_s || 0, notes: r.notes || '', ex: Array.isArray(r.ex) ? r.ex : [],
    vol: r.vol || 0, done: r.sets_done || 0, total: r.sets_total || 0
  };
}
function treinoParaLinha(uid, s){
  return {
    id: s.id, user_id: uid, plan_id: s.planId || null, letter: s.letter, workout_name: s.wname || null,
    started_at: new Date(s.start).toISOString(), ended_at: s.end ? new Date(s.end).toISOString() : null,
    dur_s: s.dur || 0, notes: s.notes || null, ex: s.ex || [], vol: s.vol || 0, sets_done: s.done || 0, sets_total: s.total || 0
  };
}
function linhaParaFicha(r){
  const t = r.treinos || {};
  return { id: r.id, nome: r.nome, ativa: r.ativa, order: t.order || [], w: t.w || {}, sched: r.cronograma || {}, updated: r.updated_at };
}

// ---------- Carga inicial ----------
export async function carregarTudo(uid){
  const [perfil, fichas, treinos, peso, aval, fotos, rascunho, videos, editor] = await Promise.all([
    sb.from('profiles').select('nome,avatar_path,instagram').eq('id', uid).maybeSingle().then(ok),
    sb.from('plans').select('*').order('created_at', { ascending: true }).then(ok),
    sb.from('sessions').select('*').order('started_at', { ascending: false }).limit(1000).then(ok),
    sb.from('body_weights').select('d,kg').order('d', { ascending: true }).then(ok),
    sb.from('assessments').select('id,d,src,items,created_at').order('d', { ascending: true }).then(ok),
    sb.from('photos').select('id,d,pose,path').order('d', { ascending: true }).then(ok),
    sb.from('drafts').select('data,updated_at').eq('user_id', uid).maybeSingle().then(ok),
    sb.from('exercise_videos').select('chave,nome,video').then(ok),
    sb.from('video_editores').select('user_id').eq('user_id', uid).then(ok)
  ]);
  return {
    nome: perfil && perfil.nome || '',
    avatar: perfil && perfil.avatar_path || '',
    instagram: perfil && perfil.instagram || '',
    fichas: (fichas || []).map(linhaParaFicha),
    treinos: (treinos || []).map(linhaParaTreino),
    peso: (peso || []).map(p => ({ d: p.d, kg: Number(p.kg) })),
    avaliacoes: (aval || []).map(a => ({ id: a.id, d: a.d, src: a.src, items: a.items || [], t: Date.parse(a.created_at) })),
    fotos: (fotos || []).map(f => ({ id: f.id, d: f.d, pose: f.pose, path: f.path })),
    rascunho: rascunho ? rascunho.data : null,
    videos: (videos || []).map(v => ({ chave: v.chave, nome: v.nome, video: v.video })),
    editor: !!(editor && editor.length)
  };
}

// ---------- Perfil ----------
export async function salvarPerfil(uid, dados){
  ok(await sb.from('profiles').upsert(Object.assign({ id: uid }, dados), { onConflict: 'id' }));
}
export async function enviarAvatar(uid, blob, antigo){
  const path = `${uid}/avatar-${Date.now()}.jpg`;
  ok(await sb.storage.from('fotos').upload(path, blob, { contentType: 'image/jpeg', upsert: false }));
  ok(await sb.from('profiles').upsert({ id: uid, avatar_path: path }, { onConflict: 'id' }));
  if(antigo && antigo !== path){ try{ await sb.storage.from('fotos').remove([antigo]); }catch(e){} urls.delete(antigo); }
  return path;
}
export async function baixarFoto(path){ return ok(await sb.storage.from('fotos').download(path)); }

// ---------- Fichas ----------
export async function salvarFicha(uid, id, nome, json){
  if(id){
    return linhaParaFicha(ok(await sb.from('plans').update({ nome, treinos: json.treinos, cronograma: json.cronograma }).eq('id', id).select().single()));
  }
  ok(await sb.from('plans').update({ ativa: false }).eq('user_id', uid).eq('ativa', true));
  return linhaParaFicha(ok(await sb.from('plans').insert({ user_id: uid, nome, treinos: json.treinos, cronograma: json.cronograma, ativa: true }).select().single()));
}
export async function ativarFicha(uid, id){
  ok(await sb.from('plans').update({ ativa: false }).eq('user_id', uid).neq('id', id));
  ok(await sb.from('plans').update({ ativa: true }).eq('id', id));
}
export async function apagarFicha(id){ ok(await sb.from('plans').delete().eq('id', id)); }

// ---------- Treinos ----------
export async function salvarTreino(uid, s){ ok(await sb.from('sessions').upsert(treinoParaLinha(uid, s), { onConflict: 'id' })); }
export async function apagarTreino(id){ ok(await sb.from('sessions').delete().eq('id', id)); }

let rascunhoPendente = null, rascunhoGravando = false, rascunhoTimer = null;
export function salvarRascunho(uid, data){
  rascunhoPendente = { uid, data };
  clearTimeout(rascunhoTimer);
  rascunhoTimer = setTimeout(gravarRascunho, 1500);
}
async function gravarRascunho(){
  if(rascunhoGravando || !rascunhoPendente) return;
  const { uid, data } = rascunhoPendente; rascunhoPendente = null; rascunhoGravando = true;
  try{
    if(data) await sb.from('drafts').upsert({ user_id: uid, data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    else await sb.from('drafts').delete().eq('user_id', uid);
  }catch(e){ /* tenta de novo na próxima mudança */ }
  rascunhoGravando = false;
  if(rascunhoPendente) gravarRascunho();
}
export function apagarRascunho(uid){ clearTimeout(rascunhoTimer); rascunhoPendente = { uid, data: null }; gravarRascunho(); }

// ---------- Peso ----------
export async function salvarPeso(uid, d, kg){ ok(await sb.from('body_weights').upsert({ user_id: uid, d, kg }, { onConflict: 'user_id,d' })); }
export async function apagarPeso(d){ ok(await sb.from('body_weights').delete().eq('d', d)); }

// ---------- Avaliações ----------
export async function salvarAvaliacao(uid, a){
  const r = ok(await sb.from('assessments').insert({ user_id: uid, d: a.d, src: a.src, items: a.items }).select('id,created_at').single());
  return { ...a, id: r.id, t: Date.parse(r.created_at) };
}
export async function apagarAvaliacao(id){ ok(await sb.from('assessments').delete().eq('id', id)); }

// ---------- Fotos ----------
const urls = new Map(); // path -> {url, exp}
export async function enviarFoto(uid, d, pose, blob, antiga){
  const path = `${uid}/${d}-${pose}-${Date.now()}.jpg`;
  ok(await sb.storage.from('fotos').upload(path, blob, { contentType: 'image/jpeg', upsert: false }));
  const r = ok(await sb.from('photos').upsert({ user_id: uid, d, pose, path }, { onConflict: 'user_id,d,pose' }).select('id,d,pose,path').single());
  if(antiga && antiga.path && antiga.path !== path){ try{ await sb.storage.from('fotos').remove([antiga.path]); }catch(e){} }
  return { id: r.id, d: r.d, pose: r.pose, path: r.path };
}
export async function apagarFoto(f){
  ok(await sb.from('photos').delete().eq('id', f.id));
  try{ await sb.storage.from('fotos').remove([f.path]); }catch(e){}
  urls.delete(f.path);
}
export function urlEmCache(path){ const u = urls.get(path); return u && u.exp > Date.now() ? u.url : null; }
export async function urlsDasFotos(paths){
  const faltam = paths.filter(p => !urlEmCache(p));
  if(faltam.length){
    const data = ok(await sb.storage.from('fotos').createSignedUrls(faltam, 3600));
    (data || []).forEach(x => { if(x.signedUrl) urls.set(x.path, { url: x.signedUrl, exp: Date.now() + 50 * 60 * 1000 }); });
  }
  const out = {}; paths.forEach(p => { const u = urlEmCache(p); if(u) out[p] = u; });
  return out;
}

// ---------- Leitura de avaliação / ficha (Edge Function) ----------
export async function lerDocumento(tipo, arquivos){
  const { data, error } = await sb.functions.invoke('ler-documento', { body: { tipo, arquivos } });
  if(error){
    let codigo = 'falha';
    try{ const b = await error.context.json(); codigo = b.error || codigo; }catch(e){ if(error.name === 'FunctionsFetchError') codigo = 'rede'; }
    const e = new Error(codigo); e.code = codigo; throw e;
  }
  return data;
}

// ---------- Grupo da família (só frequência) ----------
function erroRpc(error){
  const m = String(error && error.message || '');
  const e = new Error(m); e.code = /codigo_invalido/.test(m) ? 'codigo_invalido' : /grupo_cheio/.test(m) ? 'grupo_cheio' : 'falha'; return e;
}
export async function meuGrupo(uid){
  const linhas = ok(await sb.from('group_members').select('group_id,joined_at,groups(id,nome,codigo)').eq('user_id', uid).order('joined_at', { ascending: true }));
  const g = (linhas || []).map(l => l.groups).filter(Boolean)[0];
  return g ? { id: g.id, nome: g.nome, codigo: g.codigo } : null;
}
export async function criarGrupo(nome){
  const { data, error } = await sb.rpc('criar_grupo', { p_nome: nome });
  if(error) throw erroRpc(error);
  const g = Array.isArray(data) ? data[0] : data;
  return { id: g.id, nome: g.nome, codigo: g.codigo };
}
export async function entrarGrupo(codigo){
  const { error } = await sb.rpc('entrar_grupo', { p_codigo: codigo });
  if(error) throw erroRpc(error);
}
export async function sairGrupo(id){
  const { error } = await sb.rpc('sair_grupo', { p_grupo: id });
  if(error) throw erroRpc(error);
}
export async function resumoGrupo(id){
  const { data, error } = await sb.rpc('grupo_resumo', { p_grupo: id });
  if(error) throw erroRpc(error);
  return (data || []).map(m => ({ uid: m.user_id, nome: m.nome || '', avatar: m.avatar_path || '', insta: m.instagram || '', dias: (m.dias || []).map(String) }));
}

// ---------- Vídeos dos exercícios (só o editor grava) ----------
export async function salvarVideos(lista){ if(lista.length) ok(await sb.from('exercise_videos').upsert(lista.map(v => ({ chave: v.chave, nome: v.nome, video: v.video, updated_at: new Date().toISOString() })), { onConflict: 'chave' })); }
export async function apagarVideos(chaves){ if(chaves.length) ok(await sb.from('exercise_videos').delete().in('chave', chaves)); }
export async function exerciciosDaFamilia(){
  const { data, error } = await sb.rpc('exercicios_da_familia');
  if(error) throw error;
  return (data || []).map(r => r.nome).filter(Boolean);
}
