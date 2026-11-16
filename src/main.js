import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/bebas-neue/400.css';
import './style.css';
import {
  LETRAS, DIAS, SEMANA, WD, FICHA_MODELO, MKEYS, MORDER, MHEAD, MMANUAL, POSES,
  slug, prepararFicha, fichaParaSalvar, fichaDaLeitura, cronogramaPadrao, chutarAumento, copia, linkOk, chaveVideo
} from './modelo.js';
import { calcular as calcConquistas, nivel, semanasAtivas, chaveDia, NIVEIS } from './conquistas.js';
import * as D from './dados.js';
import { desenharSemana, desenharMes } from './cartao.js';

/* ---------- Utilidades ---------- */
function keyOf(s){ return slug(s).replace(/-/g,'_').slice(0,40); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function num(v){ if(v==null||v==='') return null; const n = parseFloat(String(v).replace(',','.')); return isFinite(n) ? n : null; }
function r2(n){ return Math.round(n*100)/100; }
function fmtN(n, d=2){ return n==null ? '' : Number(n).toLocaleString('pt-BR',{maximumFractionDigits:d}); }
function fmtInt(n){ return Math.floor(n||0).toLocaleString('pt-BR'); }
function pad(n){ return String(n).padStart(2,'0'); }
function hhmm(ts){ const d=new Date(ts); return pad(d.getHours())+'h'+pad(d.getMinutes()); }
function fmtDate(ts){ const d=new Date(ts); return d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','')+', '+pad(d.getDate())+'/'+pad(d.getMonth()+1); }
function fmtDay(dk){ return fmtDate(new Date(dk+'T12:00').getTime()); }
function shortDay(dk){ const p=dk.split('-'); return p[2]+'/'+p[1]+'/'+p[0].slice(2); }
function dayKey(ts){ const d=new Date(ts); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function sameDay(a,b){ return dayKey(a)===dayKey(b); }
function startOfWeek(ts){ const d=new Date(ts); d.setHours(0,0,0,0); const off=(d.getDay()+6)%7; d.setDate(d.getDate()-off); return d.getTime(); }
function clock(sec){ sec=Math.max(0,Math.round(sec)); const m=Math.floor(sec/60), s=sec%60; return m+':'+pad(s); }
function elapsed(ms){ const s=Math.floor(ms/1000); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60; return (h? h+':'+pad(m) : m)+':'+pad(x); }
function mins(sec){ return Math.max(1, Math.floor((sec||0)/60)); }
function range(r){ return r[0]===r[1] ? String(r[0]) : r[0]+'–'+r[1]; }
function restTxt(s){ return s>=120 && s%60===0 ? (s/60)+' min' : s+'s'; }
function daysAgo(ts){ const a=new Date(); a.setHours(0,0,0,0); const b=new Date(ts); b.setHours(0,0,0,0); return Math.round((a-b)/864e5); }
function agoTxt(ts){ const d=daysAgo(ts); return d<=0?'hoje':d===1?'ontem':'há '+d+' dias'; }
function signed(n, u){ return (n>0?'+':'')+fmtN(n)+(u?' '+u:''); }
function uuid(){ return (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c=>{ const r=Math.random()*16|0; return (c==='x'?r:(r&3|8)).toString(16); })); }
const $ = s=>document.querySelector(s);
const ICON = {
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  back:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  sound:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/></svg>',
  mute:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  doc:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
  cam:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  share:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7.5 7.5L12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>',
  edit:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg>',
  play:'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
  swap:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/></svg>',
  bell:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 004 0"/></svg>',
  users:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.8a3.3 3.3 0 010 6.4M18.2 14.8c1.9.7 3 2.4 3.3 5.2"/></svg>'
};

/* ---------- Armazenamento local (por usuário) ---------- */
const LS = {
  get(k,d){ try{ const v=localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k,v){ try{ if(v==null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const kDraft = ()=>'mt.draft.'+UID, kPending = ()=>'mt.pending.'+UID;

/* ---------- Estado ---------- */
let UID = null, EMAIL = '', NOME = '', AVATAR = '', INSTA = '';
let AVATAR_IMG = null; // imagem já baixada para os cartões
let FICHAS = [];          // fichas do usuário (como vêm do banco)
let FICHA = null;         // ficha ativa preparada: {id, nome, order, W, sched}
let VIDEOS = {};          // biblioteca de vídeos: chave do exercício -> {nome, video}
let EDITOR = false;       // só o editor (Silas) cadastra os links de vídeo
const S = {
  view:'carregando', auth:'entrar', authMsg:'', authErr:'',
  sessions:[], body:[], measures:[], photos:[], draft:null, pending:[],
  sync:'ok', rest:null, exSel:null, mSel:null, sound:LS.get('mt.sound', true), confirmDel:null,
  evoTab:'cargas', mreview:null, pnew:null, pslot:null, cmp:{pose:'frente', a:null, b:null}, busy:false,
  edit:null, editBack:'treinos', loadErr:'',
  grupo:null, grupoM:null, grupoErr:false, offline:false
};
const kDados = ()=>'mt.dados.'+UID;
function metaSemana(){ return FICHA ? (SEMANA.filter(dd=>FICHA.W[FICHA.sched[dd]]).length || FICHA.order.length) : 3; }
function minhasConquistas(sessoes){
  return calcConquistas(sessoes || S.sessions, { meta: metaSemana(),
    avaliacoes: S.measures.map(m=>m.t || Date.parse(m.d+'T12:00')), fotos: S.photos.map(f=>Date.parse(f.d+'T12:00')) });
}
function videoDe(e){ const v = e && e.n ? VIDEOS[chaveVideo(e.n)] : null; return (v && v.video) || (e && e.video) || ''; }
function videoLink(e){ const u = videoDe(e); return u ? `<a class="vlink" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${ICON.play} Ver execução</a>` : ''; }

function definirFicha(){
  const ativa = FICHAS.find(f=>f.ativa) || FICHAS[FICHAS.length-1] || null;
  if(!ativa){ FICHA = null; return; }
  FICHA = Object.assign({ id:ativa.id, nome:ativa.nome }, prepararFicha(ativa));
}
function nomeDeChave(){
  const N = {};
  S.sessions.forEach(s=>(s.ex||[]).forEach(e=>(e.keys||[]).forEach((k,i)=>{ if(!N[k]) N[k] = (e.parts||[e.n])[i] || e.n; })));
  if(FICHA) FICHA.order.forEach(L=>FICHA.W[L].ex.forEach(e=>e.keys.forEach((k,i)=>{ N[k] = e.parts[i]; })));
  return N;
}

/* ---------- Regras de treino ---------- */
function sessionsDaFicha(){ return FICHA ? S.sessions.filter(s=>s.planId===FICHA.id) : []; }
function nextLetter(){
  if(!FICHA || !FICHA.order.length) return null;
  const last = sessionsDaFicha()[0];
  if(!last || FICHA.order.indexOf(last.letter)<0) return FICHA.order[0];
  return FICHA.order[(FICHA.order.indexOf(last.letter)+1)%FICHA.order.length];
}
function newDraft(L){
  const W = FICHA.W[L];
  return { planId:FICHA.id, letter:L, w:copia(W), start:Date.now(), at:Date.now(), lastSetAt:0, notes:'',
    ex: W.ex.map(e=>({ sets: Array.from({length:e.s}, ()=>({done:false, p:e.parts.map(()=>({kg:'',r:''}))})) })) };
}
function countDone(d){ let sets=0,total=0; d.ex.forEach(e=>e.sets.forEach(s=>{ total++; if(s.done) sets++; })); return {sets,total}; }
// Última vez: prefere a mesma ficha e o mesmo treino; senão, o mesmo exercício em outro treino.
function lastEx(key, before, letter, planId){
  let other = null;
  for(const s of S.sessions){
    if(before && s.start>=before) continue;
    const e = (s.ex||[]).find(x=>x.key===key);
    if(!e || !e.sets || !e.sets.length) continue;
    if(s.letter===letter && (!planId || s.planId===planId)) return {s, e};
    if(!other) other = {s, e};
  }
  return other;
}
function setTxt(set, pi){ const p=set.p[pi]||{}; const kg=p.kg!=null&&p.kg!==''?fmtN(p.kg):'–'; const r=p.r!=null&&p.r!==''?p.r:'–'; return kg+'×'+r; }
function lastSummary(e, def){
  if(def.parts.length===1) return e.sets.map(s=>setTxt(s,0)).join(' · ');
  return def.parts.map((n,i)=>'<b>'+esc(n)+'</b> '+e.sets.map(s=>setTxt(s,i)).join(', ')).join(' · ');
}
/* Sugestão de carga (dupla progressão) */
function suggest(def, before, letter, planId){
  const le = lastEx(def.key, before, letter, planId);
  if(!le) return null;
  const rmin = def.r[0], rmax = def.r[1];
  const parts = def.parts.map((pn,pi)=>{
    const ls = le.e.sets.map(s=>({kg:num(s.p[pi]&&s.p[pi].kg), r:num(s.p[pi]&&s.p[pi].r)}));
    const inc = def.incs[pi] || 0;
    const kgs = ls.map(x=>x.kg).filter(x=>x!=null && x>0);
    const top = kgs.length ? Math.max.apply(null, kgs) : null;
    const withR = ls.filter(x=>x.r!=null);
    if(!withR.length) return null;
    const allTop = ls.length>=def.s && ls.every(x=>x.r!=null && x.r>=rmax);
    const below = withR.filter(x=>x.r<rmin).length;
    const bw = top==null || !inc;
    let kind, sets, msg;
    if(allTop && bw){
      kind='bwtop'; sets=ls.map(x=>({kg:x.kg, r:rmax}));
      msg = top==null ? `Você fez ${rmax} reps em todas as séries. Deixe mais difícil: pausa no topo, descida mais lenta ou carga extra.`
                      : `Você fez ${rmax} reps em todas as séries com ${fmtN(top)} kg. Aumente a carga se der.`;
    } else if(allTop){
      kind='up'; sets=ls.map(x=>({kg:x.kg!=null&&x.kg>0 ? r2(x.kg+inc) : x.kg, r:rmin}));
      msg = `Suba para ${fmtN(r2(top+inc))} kg (+${fmtN(inc)}) e recomece em ${rmin} reps. Você fez ${rmax} em todas as séries.`;
    } else if(!bw && withR.length>=2 && below===withR.length){
      kind='down'; sets=ls.map(x=>({kg:x.kg!=null&&x.kg>0 ? Math.max(0, r2(x.kg-inc)) : x.kg, r:rmin}));
      msg = `Desça para ${fmtN(Math.max(0, r2(top-inc)))} kg. Da última vez ficou abaixo de ${rmin} reps em todas as séries.`;
    } else if(below>=2){
      kind='hold'; sets=ls.map(x=>({kg:x.kg, r:rmin}));
      msg = top!=null ? `Mantenha ${fmtN(top)} kg até fazer ${rmin} reps em todas as séries.` : `Busque ${rmin} reps em todas as séries.`;
    } else {
      kind='reps'; sets=ls.map(x=>({kg:x.kg, r:Math.min(rmax, (x.r!=null?x.r:rmin)+1)}));
      msg = top!=null ? `Mantenha ${fmtN(top)} kg e busque +1 rep por série, até ${rmax}.` : `Busque +1 rep por série, até ${rmax}.`;
    }
    return {kind, sets, msg, name:pn};
  });
  if(parts.every(p=>!p)) return null;
  return {le, parts};
}
function sugAt(sug, pi, si){ const p = sug && sug.parts[pi]; if(!p) return null; return p.sets[Math.min(si, p.sets.length-1)] || null; }
function sugBlock(sug, def){
  if(!sug) return '';
  return sug.parts.map(p=>{
    if(!p) return '';
    const cls = p.kind==='up'||p.kind==='bwtop' ? 'up' : p.kind==='down' ? 'down' : '';
    return `<p class="sug ${cls}"><b>${p.kind==='up'?'▲ ':p.kind==='down'?'▼ ':''}${def.parts.length>1?esc(p.name)+': ':'Hoje: '}</b>${esc(p.msg)}</p>`;
  }).join('');
}
function sessionVolume(ex){ let v=0; ex.forEach(e=>e.sets.forEach(s=>s.p.forEach(p=>{ const kg=num(p.kg), r=num(p.r); if(kg && r) v+=kg*r; }))); return Math.floor(v); }
function bestByKey(before){
  const best = {};
  S.sessions.forEach(s=>{
    if(before && s.start>=before) return;
    (s.ex||[]).forEach(e=>(e.keys||[]).forEach((k,i)=>e.sets.forEach(st=>{ const kg=num(st.p[i]&&st.p[i].kg); if(kg && (!best[k]||kg>best[k])) best[k]=kg; })));
  });
  return best;
}

/* ---------- Render ---------- */
const TABS = ['hoje','treinos','historico','evolucao'];
function render(){
  if(S.view==='sessao' && !S.draft) S.view = 'hoje';
  const v = S.view;
  let html = '';
  if(v==='carregando') html = vCarregando();
  else if(v==='auth') html = vAuth();
  else if(v==='nova-senha') html = vNovaSenha();
  else if(v==='onboarding') html = vOnboarding();
  else if(v==='ficha') html = vFicha();
  else if(v==='hoje') html = vHoje();
  else if(v==='treinos') html = vTreinos();
  else if(v.indexOf('treino:')===0) html = vTreino(v.slice(7));
  else if(v==='historico') html = vHistorico();
  else if(v==='evolucao') html = vEvolucao();
  else if(v==='sessao') html = vSessao();
  $('#app').innerHTML = html;
  const fora = ['carregando','auth','nova-senha','onboarding','ficha'].indexOf(v)>=0;
  document.body.classList.toggle('in-session', v==='sessao');
  document.body.classList.toggle('no-nav', fora);
  TABS.forEach(t=>{
    const b = $('#nav-'+t);
    const cur = v===t || (t==='treinos' && v.indexOf('treino:')===0);
    if(cur) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
  });
  renderStatus(); renderLive(); tickClock();
  if(v==='sessao') updateProgress();
  hidratarFotos();
}
function statusPill(){ return '<span class="sync" id="sync"></span>'; }
function renderStatus(){
  const el = $('#sync'); if(!el) return;
  const map = { ok:['ok','Salvo'], saving:['loading','Salvando'], offline:['warn','Sem conexão'] };
  const m = map[S.pending.length && S.sync==='ok' ? 'offline' : S.sync] || map.ok;
  el.className = 'sync '+m[0]; el.textContent = m[1];
  el.title = S.pending.length ? S.pending.length+' treino(s) esperando conexão para salvar.' : '';
}
function renderLive(){ $('#live').hidden = !(S.draft && S.view!=='sessao' && TABS.concat(['treino']).some(t=>S.view.indexOf(t)===0)); }
function avatarBtn(){
  const ini = (NOME||EMAIL||'?').trim().split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase();
  return `<button class="avatar" data-a="perfil" aria-label="Conta e fichas">${AVATAR?`<img data-path="${esc(AVATAR)}" alt="">`:esc(ini)}</button>`;
}

function vCarregando(){
  return `<div class="center-screen">${S.loadErr ? `<div class="empty"><b>Não consegui carregar seus dados</b>${esc(S.loadErr)}<div class="btns" style="margin-top:14px"><button class="btn primary" data-a="recarregar">Tentar de novo</button><button class="btn ghost" data-a="sair">Sair da conta</button></div></div>` : '<div class="spin" aria-hidden="true"></div><p class="note">Carregando…</p>'}</div>`;
}

/* ----- Login ----- */
function marca(){ return `<div class="brand"><span class="neon">MEUS</span><span class="brand-2">TREINOS</span><p>Ficha, cargas e evolução no seu bolso.</p></div>`; }
function vAuth(){
  const m = S.auth;
  if(!D.configurado) return `${marca()}<div class="empty"><b>App sem configuração</b>Faltam as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.</div>`;
  const tabs = `<div class="seg" role="tablist"><button role="tab" aria-selected="${m==='entrar'}" data-a="auth-tab" data-t="entrar">Entrar</button><button role="tab" aria-selected="${m==='criar'}" data-a="auth-tab" data-t="criar">Criar conta</button><button role="tab" aria-selected="${m==='senha'}" data-a="auth-tab" data-t="senha">Esqueci a senha</button></div>`;
  const msg = S.authErr ? `<p class="formmsg err">${esc(S.authErr)}</p>` : S.authMsg ? `<p class="formmsg">${esc(S.authMsg)}</p>` : '';
  let form;
  if(m==='criar') form = `<form id="f-auth" class="form" novalidate>
      <label class="lbl" for="a-nome">Seu nome</label><input class="inp" id="a-nome" autocomplete="name" required>
      <label class="lbl" for="a-email">E-mail</label><input class="inp" id="a-email" type="email" autocomplete="email" inputmode="email" required>
      <label class="lbl" for="a-senha">Senha (mínimo 6 caracteres)</label><input class="inp" id="a-senha" type="password" autocomplete="new-password" minlength="6" required>
      <button class="btn primary" type="submit" style="margin-top:18px">Criar conta</button></form>`;
  else if(m==='senha') form = `<form id="f-auth" class="form" novalidate>
      <p class="note" style="margin-top:0">Mandamos um link para você criar uma senha nova.</p>
      <label class="lbl" for="a-email">E-mail</label><input class="inp" id="a-email" type="email" autocomplete="email" inputmode="email" required>
      <button class="btn primary" type="submit" style="margin-top:18px">Enviar link</button></form>`;
  else form = `<form id="f-auth" class="form" novalidate>
      <label class="lbl" for="a-email">E-mail</label><input class="inp" id="a-email" type="email" autocomplete="email" inputmode="email" required>
      <label class="lbl" for="a-senha">Senha</label><input class="inp" id="a-senha" type="password" autocomplete="current-password" required>
      <button class="btn primary" type="submit" style="margin-top:18px">Entrar</button></form>`;
  return `<div class="auth">${marca()}<section class="card">${tabs}${msg}${form}</section></div>`;
}
function vNovaSenha(){
  const msg = S.authErr ? `<p class="formmsg err">${esc(S.authErr)}</p>` : '';
  return `<div class="auth">${marca()}<section class="card"><h2 class="h2">Nova senha</h2>${msg}
    <form id="f-nova" class="form" novalidate><label class="lbl" for="a-nova">Senha nova (mínimo 6 caracteres)</label>
    <input class="inp" id="a-nova" type="password" autocomplete="new-password" minlength="6" required>
    <button class="btn primary" type="submit" style="margin-top:18px">Salvar senha</button></form></section></div>`;
}
function traduzErroAuth(e){
  const m = String(e && (e.message||e.code) || '').toLowerCase();
  if(m.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if(m.includes('not confirmed')) return 'Confirme seu e-mail antes de entrar. Veja a caixa de entrada e o spam.';
  if(m.includes('already registered') || m.includes('already been registered')) return 'Esse e-mail já tem conta. Entre ou use "Esqueci a senha".';
  if(m.includes('at least 6') || m.includes('weak')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if(m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas agora. Espere alguns minutos e tente de novo.';
  if(m.includes('invalid') && m.includes('email')) return 'Confira o e-mail digitado.';
  if(m.includes('fetch') || m.includes('network')) return 'Sem conexão. Confira a internet e tente de novo.';
  return 'Não deu certo agora. Tente de novo.';
}
async function enviarAuth(){
  S.authErr=''; S.authMsg='';
  const email = ($('#a-email')||{}).value?.trim();
  const senha = ($('#a-senha')||{}).value || '';
  const btn = $('#f-auth button[type=submit]'); if(btn) btn.disabled = true;
  try{
    if(!email){ throw {message:'invalid email'}; }
    if(S.auth==='entrar'){
      const { error } = await D.sb.auth.signInWithPassword({ email, password:senha });
      if(error) throw error;
      return;
    }
    if(S.auth==='criar'){
      const nome = ($('#a-nome')||{}).value?.trim() || '';
      if(senha.length<6) throw {message:'at least 6'};
      const { data, error } = await D.sb.auth.signUp({ email, password:senha, options:{ data:{ nome }, emailRedirectTo: location.origin } });
      if(error) throw error;
      if(data && data.user && Array.isArray(data.user.identities) && data.user.identities.length===0) throw {message:'already registered'};
      if(!data.session){ S.auth='entrar'; S.authMsg = 'Conta criada. Abra o e-mail que enviamos para '+email+' e toque no link para confirmar. Depois é só entrar.'; }
    } else if(S.auth==='senha'){
      const { error } = await D.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
      if(error) throw error;
      S.authMsg = 'Se esse e-mail tiver conta, o link para criar uma senha nova chega em instantes.';
    }
  }catch(e){ S.authErr = traduzErroAuth(e); }
  if(S.view==='auth') render();
}
async function salvarNovaSenha(){
  const senha = ($('#a-nova')||{}).value || '';
  if(senha.length<6){ S.authErr='A senha precisa ter pelo menos 6 caracteres.'; render(); return; }
  const { data, error } = await D.sb.auth.updateUser({ password: senha });
  if(error){ S.authErr = traduzErroAuth(error); render(); return; }
  S.authErr=''; toast('Senha atualizada.');
  const u = data && data.user;
  if(u && UID===u.id){ S.view = FICHA ? 'hoje' : 'onboarding'; render(); }
  else if(u) entrar(u);
  else { S.view='auth'; render(); }
}

/* ----- Ficha: começo, edição e troca ----- */
function vOnboarding(){
  const voltar = FICHA ? `<button class="back" data-a="go" data-v="treinos">${ICON.back} Voltar</button>` : `<header class="top"><span class="date">Olá, ${esc(NOME||'')}</span>${avatarBtn()}</header>`;
  return `${voltar}
    <h1 class="h1" style="margin-top:6px">${FICHA?'Nova ficha':'Monte sua ficha'}</h1>
    <p class="note" style="margin:6px 0 16px">Escolha como começar. Dá para ajustar tudo depois.</p>
    <div class="choices">
      <button class="choice" data-a="ob-foto"><span class="ci">${ICON.doc}</span><span><b>Mandar foto ou PDF da ficha</b><small>O app lê a ficha do professor e monta os treinos. Você confere antes de salvar.</small></span></button>
      <button class="choice" data-a="ob-modelo"><span class="ci neon-s">A–E</span><span><b>Usar a ficha modelo A–E</b><small>5 treinos de hipertrofia e definição (superior, inferior e full body), 45 a 60 min.</small></span></button>
      <button class="choice" data-a="ob-zero"><span class="ci">${ICON.edit}</span><span><b>Montar do zero</b><small>Você digita os treinos e exercícios.</small></span></button>
    </div>`;
}
function abrirEditor(f, back){
  S.edit = copia(f);
  S.edit.order.forEach(L=>{ S.edit.w[L].ex.forEach(e=>{
    if(Array.isArray(e.parts) && e.parts.filter(Boolean).length>1){ e.parts = e.parts.slice(0,3); e.inc = Array.isArray(e.inc) ? e.inc : e.parts.map(()=>Number(e.inc)||0); }
    else { e.parts = null; e.inc = Array.isArray(e.inc) ? (Number(e.inc[0])||0) : (e.inc==null ? chutarAumento(e.n) : Number(e.inc)||0); }
    e.r = Array.isArray(e.r) ? e.r : [10,12];
    const nomeV = Array.isArray(e.parts) ? e.parts.filter(Boolean).join(' + ') : e.n;
    e.video = (nomeV && VIDEOS[chaveVideo(nomeV)] ? VIDEOS[chaveVideo(nomeV)].video : '') || e.video || '';
  }); });
  S.editBack = back || 'treinos';
  go('ficha');
}
function fichaAtualEditavel(){
  const raw = FICHAS.find(f=>f.id===FICHA.id);
  return { id:raw.id, nome:raw.nome, order:raw.order.slice(), w:copia(raw.w), sched:Object.assign({}, raw.sched) };
}
function vFicha(){
  const E = S.edit; if(!E) return vOnboarding();
  const opts = v=>E.order.map(L=>`<option value="${L}"${v===L?' selected':''}>Treino ${L}${E.w[L]&&E.w[L].name?' · '+esc(E.w[L].name):''}</option>`).join('')
    + `<option value="ativo"${v==='ativo'?' selected':''}>Descanso ativo</option><option value="total"${v==='total'||!v?' selected':''}>Descanso total</option>`;
  const sched = SEMANA.map(d=>`<div class="frow"><span class="sd">${WD[d]}</span><select class="inp sm" data-e="sched.${d}" aria-label="${DIAS[d]}">${opts(E.sched[d])}</select></div>`).join('');
  const treinos = E.order.map((L,wi)=>{
    const w = E.w[L];
    const ex = w.ex.map((e,i)=>{
      const bi = Array.isArray(e.parts);
      return `<div class="fx">
        <div class="fx-h"><span class="ex-num">${pad(i+1)}</span>
          <div class="fx-tools"><button class="mini" data-a="fx-up" data-l="${L}" data-i="${i}" aria-label="Subir"${i?'':' disabled'}>↑</button><button class="mini" data-a="fx-down" data-l="${L}" data-i="${i}" aria-label="Descer"${i<w.ex.length-1?'':' disabled'}>↓</button><button class="mini del" data-a="fx-del" data-l="${L}" data-i="${i}" aria-label="Remover exercício">×</button></div></div>
        ${bi ? e.parts.map((p,pi)=>`<div class="frow2"><input class="inp" data-e="w.${L}.ex.${i}.parts.${pi}" value="${esc(p)}" placeholder="Exercício ${pi+1} do bi-set" aria-label="Exercício ${pi+1} do bi-set"><label class="mini-f"><input class="inp sm" data-e="w.${L}.ex.${i}.inc.${pi}" inputmode="decimal" value="${esc(fmtN(e.inc[pi]))}" aria-label="Aumento de carga em kg"><span>+kg</span></label></div>`).join('')
             : `<div class="frow2"><input class="inp" data-e="w.${L}.ex.${i}.n" value="${esc(e.n)}" placeholder="Nome do exercício" aria-label="Nome do exercício"><label class="mini-f"><input class="inp sm" data-e="w.${L}.ex.${i}.inc" inputmode="decimal" value="${esc(fmtN(e.inc))}" aria-label="Aumento de carga em kg"><span>+kg</span></label></div>`}
        <div class="fgrid">
          <label><span>Séries</span><input class="inp sm" data-e="w.${L}.ex.${i}.s" inputmode="numeric" value="${e.s}"></label>
          <label><span>Reps mín.</span><input class="inp sm" data-e="w.${L}.ex.${i}.r.0" inputmode="numeric" value="${e.r[0]}"></label>
          <label><span>Reps máx.</span><input class="inp sm" data-e="w.${L}.ex.${i}.r.1" inputmode="numeric" value="${e.r[1]}"></label>
          <label><span>Descanso (s)</span><input class="inp sm" data-e="w.${L}.ex.${i}.rest" inputmode="numeric" value="${e.rest}"></label>
        </div>
        <textarea class="notes sm" data-e="w.${L}.ex.${i}.tip" placeholder="Dica de execução (opcional)" aria-label="Dica de execução">${esc(e.tip||'')}</textarea>
        ${EDITOR?`<label class="fld-at vid"><span>${ICON.play}</span><input class="inp sm" data-e="w.${L}.ex.${i}.video" type="url" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(e.video||'')}" placeholder="Link do vídeo de execução (opcional)" aria-label="Link do vídeo de execução"></label>`:''}
        <label class="chkline"><input type="checkbox" data-a="fx-bi" data-l="${L}" data-i="${i}"${bi?' checked':''}> Bi-set (dois exercícios sem descanso)</label>
      </div>`;
    }).join('');
    return `<section class="card fw" id="fw-${L}">
      <div class="fw-h"><span class="neon fw-l">${L}</span>
        <div class="fw-names"><input class="inp" data-e="w.${L}.name" value="${esc(w.name)}" placeholder="Nome (ex.: Superior 1)" aria-label="Nome do treino ${L}">
        <input class="inp sm" data-e="w.${L}.focus" value="${esc(w.focus||'')}" placeholder="Foco (ex.: Peito e tríceps)" aria-label="Foco do treino ${L}"></div></div>
      ${ex || '<p class="note">Nenhum exercício ainda.</p>'}
      <div class="btns two"><button class="btn sm" data-a="fx-add" data-l="${L}">+ Exercício</button>${E.order.length>1?`<button class="btn sm danger" data-a="fw-del" data-l="${L}">Remover treino ${L}</button>`:''}</div>
    </section>`;
  }).join('');
  return `<div class="shead plain"><div class="shead-row">
      <button class="iconbtn" data-a="f-cancel" aria-label="Cancelar edição">${ICON.back}</button>
      <div class="st"><b>${E.id?'Editar ficha':'Nova ficha'}</b><small>Confira tudo e salve no fim</small></div></div></div>
    ${E.aviso?`<p class="sug">${esc(E.aviso)}</p>`:''}
    <label class="lbl" for="f-nome">Nome da ficha</label>
    <input class="inp" id="f-nome" data-e="nome" value="${esc(E.nome||'')}">
    <section class="card" style="margin-top:14px"><h2 class="h2">Dias da semana</h2>${sched}
      <p class="note">Se faltar um dia, o app segue a sequência dos treinos.</p></section>
    ${treinos}
    ${E.order.length<7?`<button class="btn ghost" data-a="fw-add" style="margin-top:12px">+ Treino ${LETRAS.find(x=>E.order.indexOf(x)<0)}</button>`:''}
    <div class="btns" style="margin-top:18px"><button class="btn primary" data-a="f-save">Salvar ficha</button><button class="btn ghost" data-a="f-cancel">Cancelar</button></div>`;
}
// O editor grava os links na biblioteca (vale para todos que tiverem o mesmo exercício)
function mudancasDeVideo(itens){
  const gravar = [], apagar = [];
  itens.forEach(({nome, video})=>{
    const k = chaveVideo(nome||''); if(!k) return;
    const v = linkOk(video), atual = VIDEOS[k];
    if(v && (!atual || atual.video!==v)) gravar.push({chave:k, nome:nome.trim(), video:v});
    else if(!v && atual && !String(video||'').trim()) apagar.push(k);
  });
  const vistos = new Set(); return { gravar: gravar.filter(x=>!vistos.has(x.chave) && vistos.add(x.chave)), apagar:[...new Set(apagar)] };
}
async function aplicarVideos(m){
  await D.salvarVideos(m.gravar); await D.apagarVideos(m.apagar);
  m.gravar.forEach(x=>{ VIDEOS[x.chave] = {nome:x.nome, video:x.video}; });
  m.apagar.forEach(k=>{ delete VIDEOS[k]; });
  guardarCache();
}
async function sincronizarVideosDaFicha(E){
  const itens = [];
  E.order.forEach(L=>E.w[L].ex.forEach(e=>{ const nome = Array.isArray(e.parts) ? e.parts.filter(Boolean).join(' + ') : e.n; itens.push({nome, video:e.video}); }));
  try{ await aplicarVideos(mudancasDeVideo(itens)); }catch(err){ toast('A ficha foi salva, mas não consegui salvar os links de vídeo.', true); }
}
async function videosSheet(){
  openSheet(`<h2>Vídeos dos exercícios</h2><div class="spin" aria-hidden="true"></div>`);
  let nomes = [];
  try{ nomes = await D.exerciciosDaFamilia(); }catch(e){ /* sem conexão: mostra os da biblioteca e da sua ficha */ }
  if(FICHA) FICHA.order.forEach(L=>FICHA.W[L].ex.forEach(e=>nomes.push(e.n)));
  Object.values(VIDEOS).forEach(v=>nomes.push(v.nome));
  const porChave = new Map();
  nomes.forEach(n=>{ const k = chaveVideo(n||''); if(k && !porChave.has(k)) porChave.set(k, n.trim()); });
  const linhas = [...porChave.entries()].map(([k,n])=>({k, n, v: VIDEOS[k] ? VIDEOS[k].video : ''}))
    .sort((a,b)=> (a.v?1:0)-(b.v?1:0) || a.n.localeCompare(b.n,'pt-BR'));
  const sem = linhas.filter(l=>!l.v).length;
  openSheet(`<h2>Vídeos dos exercícios</h2>
    <p>Os links valem para todo mundo: quem tiver o exercício na ficha vê o botão <b>▶ Ver execução</b>. Só você pode mudar.</p>
    <p class="note" style="margin-top:0">${linhas.length} exercícios das fichas da família · <b>${sem}</b> sem vídeo</p>
    <div class="vlist">${linhas.map(l=>`<label class="vrow${l.v?' tem':''}"><span>${esc(l.n)}</span>
      <input class="inp vin" type="url" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" data-vk="${esc(l.k)}" data-vn="${esc(l.n)}" value="${esc(l.v)}" placeholder="Cole o link do vídeo"></label>`).join('')}</div>
    <div class="btns" style="margin-top:14px"><button class="btn primary" data-a="v-save">Salvar vídeos</button><button class="btn ghost" data-a="close">Fechar</button></div>`);
}
async function salvarVideosSheet(btn){
  const ins = Array.from(document.querySelectorAll('#sheet-card [data-vk]'));
  const ruim = ins.find(i=>i.value.trim() && !linkOk(i.value));
  if(ruim){ toast('O link de "'+ruim.dataset.vn+'" não parece um endereço válido.', true); ruim.focus(); return; }
  const m = mudancasDeVideo(ins.map(i=>({nome:i.dataset.vn, video:i.value})));
  if(!m.gravar.length && !m.apagar.length){ closeSheet(true); return; }
  btn.disabled = true;
  try{ await aplicarVideos(m); closeSheet(true); render(); toast('Vídeos salvos para todos.'); }
  catch(e){ btn.disabled = false; toast('Não consegui salvar agora. Confira a internet.', true); }
}
function setPath(obj, path, val){
  const ks = path.split('.'); let o = obj;
  for(let i=0;i<ks.length-1;i++){ o = o[ks[i]]; if(o==null) return; }
  o[ks[ks.length-1]] = val;
}
function editInput(el){
  const p = el.dataset.e; let v = el.value;
  if(/\.(s|rest)$|\.r\.\d$/.test(p)){ v = parseInt(v,10); if(!isFinite(v)) v = 0; }
  else if(/\.inc(\.\d)?$/.test(p)){ v = num(v) || 0; }
  setPath(S.edit, p, v);
}
function validarFicha(E){
  if(!E.order.length) return 'A ficha precisa de pelo menos um treino.';
  for(const L of E.order){
    const w = E.w[L];
    if(!w.name || !w.name.trim()) return 'Dê um nome ao treino '+L+'.';
    if(!w.ex.length) return 'O treino '+L+' está sem exercícios.';
    for(const [i,e] of w.ex.entries()){
      const nome = Array.isArray(e.parts) ? e.parts.filter(x=>x&&x.trim()).length>=2 : (e.n && e.n.trim());
      if(!nome) return 'Falta o nome do exercício '+(i+1)+' do treino '+L+'.';
      if(!(e.s>=1 && e.s<=10)) return 'Séries do exercício '+(i+1)+' do treino '+L+': use de 1 a 10.';
      if(!(e.r[0]>=1) || e.r[1]<e.r[0]) return 'Confira as repetições do exercício '+(i+1)+' do treino '+L+'.';
      if(EDITOR && e.video && String(e.video).trim() && !linkOk(e.video)) return 'O link do vídeo do exercício '+(i+1)+' do treino '+L+' não parece um endereço válido.';
    }
  }
  return '';
}
async function salvarEdicao(){
  const E = S.edit;
  E.nome = (E.nome||'').trim() || 'Minha ficha';
  const erro = validarFicha(E);
  if(erro){ toast(erro, true); return; }
  const json = fichaParaSalvar(E);
  const btn = document.querySelector('[data-a="f-save"]'); if(btn) btn.disabled = true;
  try{
    const salvo = await D.salvarFicha(UID, E.id||null, E.nome, json);
    if(E.id) FICHAS = FICHAS.map(f=>f.id===salvo.id?salvo:f);
    else { FICHAS = FICHAS.map(f=>Object.assign({}, f, {ativa:false})).concat([salvo]); }
    definirFicha(); S.edit = null;
    if(EDITOR) await sincronizarVideosDaFicha(E);
    go('treinos'); toast('Ficha salva.');
  }catch(e){ if(btn) btn.disabled = false; toast('Não consegui salvar a ficha. Confira a conexão e tente de novo.', true); }
}

/* ----- Hoje ----- */
function vHoje(){
  if(!FICHA) return vOnboarding();
  const now = Date.now(), dow = new Date().getDay(), sched = FICHA.sched[dow];
  const doPlano = sessionsDaFicha();
  const last = doPlano[0];
  const todayDone = S.sessions.filter(s=>sameDay(s.start, now));
  const d = S.draft;
  let hero='';
  if(d){
    const c = countDone(d);
    hero = `<section class="hero">
      <div class="eyebrow"><span class="dot"></span>Treino em andamento</div>
      <div class="hero-row"><div class="big-letter neon" aria-hidden="true">${esc(d.letter)}</div>
        <div><div class="hero-name">${esc(d.w.name)}</div><div class="hero-focus">${esc(d.w.focus)}</div>
        <div class="meta">${c.sets} de ${c.total} séries · começou às ${hhmm(d.start)}</div></div></div>
      <div class="btns" style="margin-top:16px"><button class="btn primary" data-a="go" data-v="sessao">Continuar treino ${esc(d.letter)}</button>
      <button class="btn ghost" data-a="discard">Descartar este treino</button></div></section>`;
  } else {
    const L = nextLetter(), W = FICHA.W[L];
    const ups = W.ex.reduce((n,e)=>{ const s=suggest(e, 0, L, FICHA.id); return n + (s ? s.parts.filter(p=>p&&p.kind==='up').length : 0); }, 0);
    const seq = FICHA.order.join(' → ');
    const why = last
      ? `Último: Treino ${esc(last.letter)} em ${fmtDate(last.start)}. Se faltar um dia, siga a sequência ${seq}.`
      : `Primeiro registro: comece pelo ${FICHA.order[0]} e siga a sequência ${seq}.`;
    hero = `<section class="hero">
      <div class="eyebrow">Próximo treino</div>
      <div class="hero-row"><div class="big-letter neon" aria-hidden="true">${L}</div>
        <div><div class="hero-name">${esc(W.name)}</div><div class="hero-focus">${esc(W.focus)}</div>
        <div class="meta">${W.ex.length} exercícios · ${W.total} séries</div></div></div>
      <p class="why">${why}${ups?` <span class="upnote">▲ ${ups} ${ups>1?'exercícios prontos':'exercício pronto'} para subir carga.</span>`:''}</p>
      <div class="btns"><button class="btn primary" data-a="start" data-l="${L}">Começar treino ${L}</button>
      <button class="btn ghost" data-a="go" data-v="treino:${L}">Ver exercícios</button></div></section>`;
  }
  let today;
  if(todayDone.length) today = `Hoje você já fez o <b>Treino ${todayDone.map(s=>esc(s.letter)).join(' e ')}</b> em ${mins(todayDone[0].dur)} min.`;
  else if(sched==='total') today = `Hoje (${DIAS[dow]}) é <b>descanso total</b>: recuperação muscular.`;
  else if(sched==='ativo') today = `Hoje (${DIAS[dow]}) é <b>descanso ativo</b>: recuperação, sono e hidratação.`;
  else {
    today = `Cronograma de hoje (${DIAS[dow]}): <b>Treino ${sched}</b>.`;
    if(!d && last && sched!==nextLetter()) today += ` Pela sequência, o próximo é o ${nextLetter()}.`;
  }
  const wk = startOfWeek(now);
  const weekSessions = S.sessions.filter(s=>s.start>=wk);
  const meta = SEMANA.filter(dd=>FICHA.W[FICHA.sched[dd]]).length || FICHA.order.length;
  const cells = SEMANA.map((wd,i)=>{
    const dayTs = wk + i*864e5;
    const done = S.sessions.filter(s=>sameDay(s.start, dayTs));
    const plan = FICHA.sched[wd];
    const isRest = plan==='ativo'||plan==='total';
    const isToday = sameDay(dayTs, now);
    const g = done.length ? `<span class="ck" aria-hidden="true">${ICON.check}</span>` : (isRest ? (plan==='ativo'?'☾':'⚡') : plan);
    const sub = done.length ? done.map(s=>esc(s.letter)).join('+') : (isRest ? 'folga' : '');
    return `<div class="day${done.length?' done':''}${isRest&&!done.length?' rest':''}${isToday?' today':''}" aria-label="${DIAS[wd]}${done.length?': treino '+done.map(s=>esc(s.letter)).join(' e ')+' feito':''}"><span class="d">${WD[wd]}</span><span class="g">${g}</span><span class="s">${sub}</span></div>`;
  }).join('');
  const lastBody = S.body[S.body.length-1];
  const lastAny = S.sessions[0];
  const tiles = `<div class="tiles">
    <div class="tile"><div class="k">Semana</div><div class="v">${weekSessions.length}<small> de ${meta}</small></div></div>
    <div class="tile"><div class="k">Último</div><div class="v">${lastAny ? agoTxt(lastAny.start) : '—'}</div></div>
    <button class="tile" data-a="evo" data-t="corpo" style="text-align:left;color:inherit;font:inherit"><span class="k">Peso</span><span class="v">${lastBody ? fmtN(lastBody.kg)+'<small> kg</small>' : '<small>registrar</small>'}</span></button>
  </div>`;
  let date = new Date().toLocaleDateString('pt-BR',{weekday:'long', day:'numeric', month:'long'}); date = date.charAt(0).toUpperCase()+date.slice(1);
  return `<header class="top"><span class="date">${esc(date)}</span><span class="top-r">${statusPill()}${avatarBtn()}</span></header>
    ${hero}
    <p class="todayline">${today}</p>
    <div class="section"><div class="card-h"><h2 class="h2">Esta semana</h2><button class="link" data-a="share" data-t="semana">${ICON.share} Compartilhar</button></div><div class="week">${cells}</div></div>
    <div class="section">${nivelStrip()}</div>
    <div class="section">${tiles}</div>
    ${grupoCard()}`;
}
function nivelStrip(){
  const nv = nivel(S.sessions.length);
  const sem = semanasAtivas(S.sessions.map(s=>chaveDia(s.start)));
  const nc = minhasConquistas().filter(c=>c.at).length;
  return `<button class="lvl" data-a="evo" data-t="conquistas" aria-label="Nível ${esc(nv.nome)}, ${sem} semanas ativas, ${nc} conquistas. Ver conquistas.">
    <span class="lvl-fire${sem?'':' off'}"><span aria-hidden="true">🔥</span><b>${sem}</b><small>${sem===1?'semana ativa':'semanas ativas'}</small></span>
    <span class="lvl-main"><span class="lvl-top"><b>Nível ${esc(nv.nome)}</b><small>${nv.prox ? 'faltam '+(nv.prox.n-nv.n)+' para '+esc(nv.prox.nome) : 'nível máximo'}</small></span>
    <span class="bar"><i style="width:${Math.round(nv.pct*100)}%"></i></span>
    <small class="lvl-c">🏅 ${nc} ${nc===1?'conquista':'conquistas'} · ver todas ›</small></span></button>`;
}

/* ----- Grupo da família ----- */
function iniciais(n){ return (n||'?').trim().split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase(); }
function grupoCard(){
  if(!S.grupo){
    if(S.grupoErr) return '';
    return `<div class="section"><button class="gcta" data-a="grupo"><span class="ci">${ICON.users}</span><span><b>Treinar junto com a família</b><small>Crie um grupo e vejam quem treinou na semana.</small></span><span class="chev" aria-hidden="true">›</span></button></div>`;
  }
  let corpo;
  if(!S.grupoM) corpo = `<p class="note" style="margin:0">${S.grupoErr ? 'Sem conexão para atualizar o grupo agora.' : 'Carregando…'}</p>`;
  else {
    const agora = Date.now(), wk = startOfWeek(agora), hoje = chaveDia(agora), mes = hoje.slice(0,7);
    const meus = S.sessions.map(x=>chaveDia(x.start));
    const linhas = S.grupoM.map(m=>{
      const eu = m.uid===UID;
      const dias = eu ? [...new Set(m.dias.concat(meus))] : m.dias;
      const set = new Set(dias);
      const dots = SEMANA.map((wd,i)=>{ const dk = chaveDia(wk + i*864e5 + 12*36e5); return { feito:set.has(dk), hoje:dk===hoje, fut:dk>hoje }; });
      return Object.assign({}, m, { eu, dots, nSem:dots.filter(x=>x.feito).length, nMes:[...set].filter(d=>d.slice(0,7)===mes).length, seq:semanasAtivas(dias, agora) });
    }).sort((a,b)=> b.nSem-a.nSem || b.nMes-a.nMes || a.nome.localeCompare(b.nome));
    const topo = linhas.length>1 && linhas[0].nSem>0 && linhas[1].nSem<linhas[0].nSem ? linhas[0].nSem : -1;
    corpo = linhas.map(m=>`<div class="gm${m.eu?' eu':''}">
      <span class="avatar sm" aria-hidden="true">${m.avatar?`<img data-path="${esc(m.avatar)}" alt="">`:esc(iniciais(m.nome))}</span>
      <span class="gm-n"><b>${esc(m.eu ? 'Você' : (m.nome||'Sem nome'))}${m.nSem===topo?' <span title="Mais dias na semana">👑</span>':''}</b>
        <small>${m.nMes} ${m.nMes===1?'dia':'dias'} no mês${m.seq?' · 🔥 '+m.seq+(m.seq===1?' semana':' semanas'):''}</small></span>
      <span class="gm-dots" aria-label="${m.nSem} ${m.nSem===1?'dia':'dias'} de treino nesta semana">${m.dots.map(x=>`<i class="${x.feito?'on':''}${x.hoje?' hj':''}${x.fut?' fut':''}"></i>`).join('')}</span>
      <span class="gm-c" aria-hidden="true">${m.nSem}</span></div>`).join('');
  }
  return `<div class="section"><div class="card-h"><h2 class="h2">${esc(S.grupo.nome)}</h2><button class="link" data-a="grupo">${ICON.users} Convidar</button></div>
    <section class="card gcard">${corpo}<p class="note gfoot">Ranking pelos dias de treino da semana. Semana ativa = 3 ou mais dias.</p></section></div>`;
}
const AVISO_GRUPO = `<p class="note">No grupo, os outros veem só seu nome, foto, @ e os dias em que você treinou. Cargas, peso, medidas e fotos de evolução continuam só seus.</p>`;
function grupoSheet(){
  if(S.grupo){
    openSheet(`<h2>${esc(S.grupo.nome)}</h2><p>Para alguém entrar, a pessoa cria a conta dela no app e usa este código em <b>Perfil › Grupo da família</b>:</p>
      <div class="gcode" aria-label="Código do grupo">${esc(S.grupo.codigo)}</div>
      <div class="btns"><button class="btn primary" data-a="g-convite">${ICON.share} Enviar convite</button></div>
      ${AVISO_GRUPO}
      <div class="btns" style="margin-top:12px"><button class="btn danger" data-a="g-sair">Sair do grupo</button><button class="btn ghost" data-a="close">Fechar</button></div>`);
    return;
  }
  openSheet(`<h2>Grupo da família</h2><p>Vejam juntos quem treinou na semana, a sequência de cada um e quem treinou mais.</p>
    ${AVISO_GRUPO}
    <h3 class="h3">Criar um grupo</h3>
    <label class="lbl" for="g-nome">Nome do grupo</label><input class="inp" id="g-nome" value="Família" maxlength="40">
    <button class="btn primary" data-a="g-criar" style="margin-top:10px">Criar grupo</button>
    <h3 class="h3">Recebeu um código?</h3>
    <label class="lbl" for="g-cod">Código do convite</label><input class="inp code" id="g-cod" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="Ex.: 7F3A9C">
    <button class="btn" data-a="g-entrar" style="margin-top:10px">Entrar no grupo</button>
    <div class="btns" style="margin-top:14px"><button class="btn ghost" data-a="close">Fechar</button></div>`);
}
const kGrupo = ()=>'mt.grupo.'+UID;
async function carregarGrupo(){
  try{
    S.grupo = await D.meuGrupo(UID);
    S.grupoM = S.grupo ? await D.resumoGrupo(S.grupo.id) : null;
    S.grupoErr = false; LS.set(kGrupo(), {g:S.grupo, m:S.grupoM});
  }catch(e){
    const c = LS.get(kGrupo(), null);
    if(c){ S.grupo = c.g; S.grupoM = c.m; } S.grupoErr = true;
  }
  if(S.view==='hoje') render();
}
function erroGrupo(e){ return e && e.code==='codigo_invalido' ? 'Código não encontrado. Confira as letras e os números.' : e && e.code==='grupo_cheio' ? 'Esse grupo já está cheio.' : 'Não consegui agora. Confira a internet e tente de novo.'; }
async function convidarGrupo(){
  const txt = `Bora treinar junto no Meus Treinos! Abra ${location.origin}, crie sua conta e, no perfil, toque em "Grupo da família" e use o código ${S.grupo.codigo}.`;
  try{ if(navigator.share){ await navigator.share({ text: txt }); return; } }catch(e){ if(e && e.name==='AbortError') return; }
  try{ await navigator.clipboard.writeText(txt); toast('Convite copiado. É só colar no WhatsApp.'); }catch(e){ toast('Código do grupo: '+S.grupo.codigo); }
}

/* ----- Lembretes (calendário do celular, sem servidor) ----- */
function lembretesSheet(){
  const cfg = LS.get('mt.lembrete', {h:'18:00', antes:15});
  const dias = SEMANA.filter(d=>FICHA.W[FICHA.sched[d]]);
  openSheet(`<h2>Lembretes de treino</h2><p>O app cria um evento que se repete toda semana em cada dia de treino. O calendário do celular avisa sozinho, mesmo com o app fechado.</p>
    <p class="note" style="margin-top:0">Dias: <b>${dias.map(d=>DIAS[d]).join(', ') || 'nenhum dia de treino na ficha'}</b></p>
    <div class="frow2 lem"><label class="lbl-in"><span>Horário do treino</span><input class="inp" id="lem-h" type="time" value="${esc(cfg.h)}"></label>
    <label class="lbl-in"><span>Avisar</span><select class="inp" id="lem-a">${[[0,'Na hora'],[15,'15 min antes'],[30,'30 min antes'],[60,'1 h antes']].map(([v,l])=>`<option value="${v}"${+cfg.antes===v?' selected':''}>${l}</option>`).join('')}</select></label></div>
    <div class="btns" style="margin-top:14px"><button class="btn primary" data-a="lem-go"${dias.length?'':' disabled'}>${ICON.bell} Adicionar ao calendário</button><button class="btn ghost" data-a="close">Fechar</button></div>
    <p class="note">No iPhone, toque em <b>Adicionar Tudo</b>. No Android, abra o arquivo baixado com o Google Agenda. Se mudar os dias da ficha, apague os eventos antigos e gere de novo.</p>`);
}
function icsTxt(t){ return String(t).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n'); }
function icsDobrar(l){
  const enc = new TextEncoder(), out = []; let atual = '', lim = 75;
  for(const ch of Array.from(l)){
    if(enc.encode(atual+ch).length > lim){ out.push(atual); atual = ' '; lim = 75; }
    atual += ch;
  }
  out.push(atual); return out.join('\r\n');
}
function gerarIcs(h, antes){
  const [hh, mm] = h.split(':').map(Number);
  const BY = ['SU','MO','TU','WE','TH','FR','SA'];
  const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
  const L = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Meus Treinos//PT-BR','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Meus Treinos'];
  SEMANA.forEach(wd=>{
    const letra = FICHA.sched[wd], W = FICHA.W[letra]; if(!W) return;
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + ((wd - d.getDay() + 7) % 7));
    const ini = d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'T'+pad(hh||0)+pad(mm||0)+'00';
    L.push('BEGIN:VEVENT', 'UID:meustreinos-'+UID.slice(0,8)+'-'+wd+'@meustreinos.app', 'DTSTAMP:'+stamp, 'DTSTART:'+ini, 'DURATION:PT1H',
      'RRULE:FREQ=WEEKLY;BYDAY='+BY[wd], 'SUMMARY:'+icsTxt('Hora do treino · Meus Treinos'),
      'DESCRIPTION:'+icsTxt('Pela agenda: Treino '+letra+' ('+W.name+'). Se faltou um dia, o app mostra o próximo da sequência. '+location.origin),
      'URL:'+location.origin, 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:'+icsTxt('Hora do treino'), 'TRIGGER:'+(antes ? '-PT'+antes+'M' : 'PT0M'), 'END:VALARM', 'END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.map(icsDobrar).join('\r\n')+'\r\n';
}
function baixarLembretes(){
  const h = ($('#lem-h') && $('#lem-h').value) || '18:00', antes = +($('#lem-a') && $('#lem-a').value) || 0;
  LS.set('mt.lembrete', {h, antes});
  const blob = new Blob([gerarIcs(h, antes)], {type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  if(ios){ window.location.href = url; }
  else { const a = document.createElement('a'); a.href = url; a.download = 'lembretes-treino.ics'; document.body.appendChild(a); a.click(); a.remove(); toast('Arquivo baixado. Abra para adicionar os lembretes ao calendário.'); }
  setTimeout(()=>{ try{ URL.revokeObjectURL(url); }catch(e){} }, 120000);
}

/* ----- Treinos ----- */
function vTreinos(){
  if(!FICHA) return vOnboarding();
  const dow = new Date().getDay();
  const rows = SEMANA.map(wd=>{
    const p = FICHA.sched[wd];
    if(p==='ativo') return `<li class="rest${wd===dow?' now':''}"><span class="sd">${WD[wd]}</span><span class="sl">☾</span><span>Descanso ativo · Recuperação, sono e hidratação</span></li>`;
    if(p==='total') return `<li class="rest${wd===dow?' now':''}"><span class="sd">${WD[wd]}</span><span class="sl">⚡</span><span>Descanso total · Recuperação muscular</span></li>`;
    return `<li class="${wd===dow?'now':''}"><span class="sd">${WD[wd]}</span><span class="sl">${p}</span><span>${esc(FICHA.W[p].name)}${FICHA.W[p].focus?' · '+esc(FICHA.W[p].focus):''}</span></li>`;
  }).join('');
  const cards = FICHA.order.map(L=>{
    const W = FICHA.W[L];
    const last = S.sessions.find(s=>s.letter===L && s.planId===FICHA.id);
    const naSemana = last && last.start >= startOfWeek(Date.now());
    return `<button class="wcard${naSemana?' feito':''}" data-a="go" data-v="treino:${L}">
      <span class="wl neon" aria-hidden="true">${L}</span>
      <span><b>${esc(W.name)}</b><small>${esc(W.focus)}</small><small>${W.ex.length} exercícios · ${W.total} séries${last && !naSemana?' · feito '+fmtDate(last.start):''}</small>${naSemana?`<span class="chip ok wk">✓ Feito ${esc(fmtDate(last.start))}</span>`:''}</span>
      <span class="chev" aria-hidden="true">${naSemana?`<span class="ck big">${ICON.check}</span>`:'›'}</span></button>`;
  }).join('');
  return `<header class="top"><h1 class="h1">Treinos</h1><span class="top-r">${statusPill()}${avatarBtn()}</span></header>
    <section class="card"><div class="card-h"><h2 class="h2">${esc(FICHA.nome)}</h2><button class="link" data-a="f-edit">${ICON.edit} Editar</button></div>
    <ol class="sched-list">${rows}</ol>
    <p class="note">Se faltar um dia, siga a sequência ${FICHA.order.join(' → ')}.</p></section>
    <div class="wlist">${cards}</div>
    <div class="btns two" style="margin-top:14px"><button class="btn sm ghost" data-a="fichas">Trocar de ficha</button><button class="btn sm ghost" data-a="go" data-v="onboarding">+ Nova ficha</button></div>`;
}
function vTreino(L){
  const W = FICHA && FICHA.W[L]; if(!W) return vTreinos();
  const ex = W.ex.map((e,i)=>{
    const sug = suggest(e, 0, L, FICHA.id);
    return `<article class="ex"><div class="ex-h"><span class="ex-num">${pad(i+1)}</span><div>
      <h3>${esc(e.n)}</h3><div class="chips"><span class="chip">${e.s} × ${range(e.r)}</span><span class="chip">Descanso ${restTxt(e.rest)}</span>${e.bi?'<span class="chip bi">Bi-set</span>':''}</div></div></div>
      ${e.tip?`<p class="tip"><b>Dica:</b> ${esc(e.tip)}</p>`:''}${videoLink(e)}
      ${sug ? `<p class="last">Última vez (${fmtDate(sug.le.s.start)}): ${lastSummary(sug.le.e, e)}</p>${sugBlock(sug, e)}` : ''}
      <div style="height:6px"></div></article>`;
  }).join('');
  return `<button class="back" data-a="go" data-v="treinos">${ICON.back} Treinos</button>
    <div class="whead"><span class="big-letter neon" aria-hidden="true">${L}</span>
      <div><div class="hero-name">${esc(W.name)}</div><div class="hero-focus">${esc(W.focus)}</div>
      ${W.rest?`<div class="meta">Descanso geral ${esc(W.rest)}</div>`:''}</div></div>
    <div class="btns" style="margin-top:14px"><button class="btn primary" data-a="start" data-l="${L}">${S.draft&&S.draft.letter===L?'Continuar':'Começar'} treino ${L}</button></div>
    <div class="exlist">${ex}</div>`;
}

/* ----- Sessão ----- */
function vSessao(){
  const d = S.draft;
  const ex = d.w.ex.map((e,i)=>exCard(e,i)).join('');
  return `<div class="shead"><div class="shead-row">
      <button class="iconbtn" data-a="go" data-v="hoje" aria-label="Voltar para o início (o treino continua)">${ICON.back}</button>
      <span class="sl neon" aria-hidden="true">${esc(d.letter)}</span>
      <div class="st"><b>${esc(d.w.name)}</b><small><span id="elapsed">0:00</span> · <span id="prog-txt"></span></small></div>
      <button class="iconbtn${S.sound?'':' off'}" data-a="sound" aria-label="${S.sound?'Desligar':'Ligar'} som do descanso">${S.sound?ICON.sound:ICON.mute}</button>
    </div><div class="prog"><i id="prog-bar"></i></div></div>
    <div class="exlist" style="margin-top:0">${ex}</div>
    <label class="lbl" for="notes">Observações</label>
    <textarea class="notes" id="notes" data-f="notes" placeholder="Como foi o treino, ajustes de carga, dores…">${esc(d.notes)}</textarea>
    <div class="btns" style="margin-top:18px">
      <button class="btn primary" data-a="finish">Finalizar treino</button>
      <button class="btn danger" data-a="discard">Descartar treino</button>
    </div>`;
}
function exCard(e, i){
  const d = S.draft, de = d.ex[i];
  const sug = suggest(e, d.start, d.letter, d.planId);
  const complete = de.sets.length && de.sets.every(s=>s.done);
  const rows = de.sets.map((st,si)=>setRow(e,i,st,si,sug)).join('');
  return `<article class="ex${complete?' complete':''}" id="ex-${i}">
    <div class="ex-h"><span class="ex-num">${pad(i+1)}</span><div>
      <h3>${esc(e.n)}</h3>
      <div class="chips"><span class="chip">${e.s} × ${range(e.r)}</span><span class="chip">${restTxt(e.rest)}</span>${e.bi?'<span class="chip bi">Bi-set</span>':''}<span class="chip ok" id="ex-ok-${i}"${complete?'':' hidden'}>Concluído</span></div>
    </div><button class="swapbtn" data-a="swap" data-ei="${i}" aria-label="Trocar ${esc(e.n)} por outro exercício">${ICON.swap}<span>Trocar</span></button></div>
    ${e.orig?`<p class="swapped">Substituído hoje (era <b>${esc(e.orig.n)}</b>) <button class="link" data-a="swap-undo" data-ei="${i}">Voltar ao original</button></p>`:''}
    ${e.tip?`<p class="tip"><b>Dica:</b> ${esc(e.tip)}</p>`:''}${videoLink(e)}
    ${sug ? `<p class="last">Última vez (${fmtDate(sug.le.s.start)}): ${lastSummary(sug.le.e, e)}</p>${sugBlock(sug, e)}` : ''}
    <div class="sets" id="sets-${i}">${rows}</div>
    <button class="addset" data-a="addset" data-ei="${i}">+ Série extra</button>
  </article>`;
}
function setRow(e, i, st, si, sug){
  const parts = e.parts.map((pn,pi)=>{
    const sp = sugAt(sug, pi, si);
    const phKg = sp && sp.kg!=null && sp.kg>0 ? fmtN(sp.kg) : '';
    const phR = sp && sp.r!=null ? String(sp.r) : '';
    const v = st.p[pi] || {kg:'',r:''};
    return `<div class="part">${e.parts.length>1?`<span class="plabel">${esc(pn)}</span>`:''}
      <label class="fld"><input id="w-${i}-${si}-${pi}" data-f="kg" data-ei="${i}" data-si="${si}" data-pi="${pi}" inputmode="decimal" autocomplete="off" placeholder="${esc(phKg||'–')}" data-ph="${esc(phKg)}" value="${esc(v.kg)}" aria-label="${esc(pn)}, série ${si+1}, carga em kg"><span>kg</span></label>
      <label class="fld"><input id="r-${i}-${si}-${pi}" data-f="r" data-ei="${i}" data-si="${si}" data-pi="${pi}" inputmode="numeric" autocomplete="off" placeholder="${esc(phR||range(e.r))}" data-ph="${esc(phR)}" value="${esc(v.r)}" aria-label="${esc(pn)}, série ${si+1}, repetições"><span>reps</span></label></div>`;
  }).join('');
  return `<div class="set${st.done?' done':''}" id="set-${i}-${si}">
    <span class="set-n">${si+1}</span><div class="set-parts">${parts}</div>
    <button class="chk" data-a="check" data-ei="${i}" data-si="${si}" aria-pressed="${st.done}" aria-label="Concluir série ${si+1}">${ICON.check}</button></div>`;
}
function updateProgress(){
  if(!S.draft) return;
  const c = countDone(S.draft);
  const t = $('#prog-txt'), b = $('#prog-bar');
  if(t) t.textContent = c.sets+'/'+c.total+' séries';
  if(b) b.style.width = (c.total? (c.sets/c.total*100):0)+'%';
  S.draft.ex.forEach((de,i)=>{
    const ok = de.sets.length && de.sets.every(s=>s.done);
    const card = $('#ex-'+i); if(card) card.classList.toggle('complete', !!ok);
    const chip = $('#ex-ok-'+i); if(chip) chip.hidden = !ok;
  });
}

/* ----- Histórico ----- */
function vHistorico(){
  const head = `<header class="top"><h1 class="h1">Histórico</h1><span class="top-r">${statusPill()}${avatarBtn()}</span></header>`
    + (S.sessions.length ? `<div class="btns two" style="margin-bottom:14px"><button class="btn sm" data-a="share" data-t="semana">${ICON.share} Semana</button><button class="btn sm" data-a="share" data-t="mes">${ICON.share} Mês</button></div>` : '');
  if(!S.sessions.length) return head+`<div class="empty"><b>Nenhum treino salvo ainda</b>Quando você finalizar um treino, ele aparece aqui com data, duração, séries e volume.</div>`;
  let html='', month='';
  S.sessions.forEach(s=>{
    const m = new Date(s.start).toLocaleDateString('pt-BR',{month:'long', year:'numeric'});
    if(m!==month){ month=m; html += `<h2 class="hist-month">${esc(m)}</h2>`; }
    const pend = S.pending.some(p=>p.id===s.id);
    html += `<button class="hrow" data-a="hist" data-id="${esc(s.id)}">
      <span class="hl neon" aria-hidden="true">${esc(s.letter)}</span>
      <span><b>${esc(fmtDate(s.start))} · ${esc(s.wname)}</b><small>${mins(s.dur)} min · ${s.done}/${s.total} séries${pend?' · esperando conexão':''}</small></span>
      <span class="hv">${fmtInt(s.vol)}<small> kg</small><small>volume</small></span></button>`;
  });
  return head+`<p class="note" style="margin:-6px 2px 0">${S.sessions.length} ${S.sessions.length===1?'treino registrado':'treinos registrados'}.</p>${html}`;
}

/* ----- Evolução ----- */
function vEvolucao(){
  const tabs = [['cargas','Cargas'],['corpo','Corpo'],['fotos','Fotos'],['conquistas','Conquistas']].map(([t,l])=>
    `<button role="tab" aria-selected="${S.evoTab===t}" data-a="evo" data-t="${t}">${l}</button>`).join('');
  const body = S.evoTab==='corpo' ? evoCorpo() : S.evoTab==='fotos' ? evoFotos() : S.evoTab==='conquistas' ? evoConquistas() : evoCargas();
  return `<header class="top"><h1 class="h1">Evolução</h1><span class="top-r">${statusPill()}${avatarBtn()}</span></header>
    <div class="seg four" role="tablist" aria-label="Seções da evolução">${tabs}</div>${body}`;
}
function evoConquistas(){
  const C = minhasConquistas(), nv = nivel(S.sessions.length), sem = semanasAtivas(S.sessions.map(s=>chaveDia(s.start)));
  const feitas = C.filter(c=>c.at).sort((a,b)=>b.at-a.at), falta = C.filter(c=>!c.at).sort((a,b)=>(b.prog[0]/b.prog[1])-(a.prog[0]/a.prog[1]));
  const prog = c=> c.tipo==='vol' ? fmtN(c.prog[0]/1000,1)+' de '+fmtN(c.prog[1]/1000,0)+' t' : c.prog[0]+' de '+c.prog[1];
  const badge = c=>`<div class="badge${c.at?' on':''}"><span class="b-ico" aria-hidden="true">${c.ico}</span><b>${esc(c.nome)}</b>
    <small>${c.at ? 'Conquistado em '+shortDay(chaveDia(c.at)) : esc(c.desc)}</small>
    ${!c.at && c.prog[1]>1 ? `<span class="bar sm" aria-hidden="true"><i style="width:${Math.round(c.prog[0]/c.prog[1]*100)}%"></i></span><small class="pg">${prog(c)}</small>` : ''}</div>`;
  const degraus = NIVEIS.map(([n,nome],i)=>`<span class="step${i<=nv.i?' on':''}${i===nv.i?' cur':''}"><b>${esc(nome)}</b><small>${n}</small></span>`).join('');
  return `<section class="card lvlcard">
      <div class="lvl-big"><span class="lv-n" aria-hidden="true">${nv.i+1}</span><div><small>Nível</small><b>${esc(nv.nome)}</b></div>
        <span class="lvl-fire${sem?'':' off'}"><span aria-hidden="true">🔥</span><b>${sem}</b><small>${sem===1?'semana ativa':'semanas ativas'}</small></span></div>
      <span class="bar"><i style="width:${Math.round(nv.pct*100)}%"></i></span>
      <p class="note">${nv.prox ? `${nv.n} ${nv.n===1?'treino':'treinos'} · faltam <b>${nv.prox.n-nv.n}</b> para o nível <b>${esc(nv.prox.nome)}</b>` : `${nv.n} treinos · nível máximo!`}</p>
      <div class="steps" aria-label="Níveis por número de treinos">${degraus}</div>
      <p class="note">Semana ativa = 3 ou mais dias de treino. A sequência continua enquanto nenhuma semana fechar abaixo disso.</p></section>
    <h2 class="h2" style="margin:18px 2px 10px">Conquistadas · ${feitas.length} de ${C.length}</h2>
    ${feitas.length ? `<div class="badges">${feitas.map(badge).join('')}</div>` : '<div class="empty"><b>Nenhuma ainda</b>Finalize seu primeiro treino para ganhar a primeira.</div>'}
    <h2 class="h2" style="margin:18px 2px 10px">Próximas</h2>
    <div class="badges">${falta.map(badge).join('')}</div>`;
}
function evoCargas(){
  const NAMES = nomeDeChave();
  const wk0 = startOfWeek(Date.now());
  const weeks = [];
  for(let i=7;i>=0;i--){ const a = wk0 - i*7*864e5, b = a + 7*864e5; weeks.push({a, n:S.sessions.filter(s=>s.start>=a && s.start<b).length}); }
  const meta = FICHA ? (SEMANA.filter(dd=>FICHA.W[FICHA.sched[dd]]).length || FICHA.order.length) : 5;
  const freq = barChart(weeks.map(w=>({lbl:pad(new Date(w.a).getDate())+'/'+pad(new Date(w.a).getMonth()+1), y:w.n})), meta);
  const series = {};
  S.sessions.slice().reverse().forEach(s=>{
    (s.ex||[]).forEach(e=>(e.keys||[]).forEach((k,i)=>{
      let best=null, reps=0, top=null;
      e.sets.forEach(st=>{ const kg=num(st.p[i]&&st.p[i].kg), r=num(st.p[i]&&st.p[i].r)||0; if(kg!=null && (best==null||kg>best)){best=kg; top=r;} if(r>reps) reps=r; });
      (series[k] = series[k] || []).push({t:s.start, kg:best, top, reps, sets:e.sets.map(st=>setTxt(st,i))});
    }));
  });
  const used = Object.keys(series);
  if(!S.exSel || !series[S.exSel]) S.exSel = used.length ? used.reduce((a,b)=> series[b][series[b].length-1].t > series[a][series[a].length-1].t ? b : a) : null;
  let exBlock;
  if(!used.length){
    exBlock = `<div class="empty" style="margin-top:4px"><b>Sem cargas registradas</b>Finalize o primeiro treino para ver a evolução de cada exercício.</div>`;
  } else {
    const grupos = [];
    const vistos = new Set();
    if(FICHA) FICHA.order.forEach(L=>{
      const ks = []; FICHA.W[L].ex.forEach(e=>e.keys.forEach(k=>{ if(series[k] && !vistos.has(k)){ ks.push(k); vistos.add(k); } }));
      if(ks.length) grupos.push([`Treino ${L} · ${FICHA.W[L].name}`, ks]);
    });
    const outros = used.filter(k=>!vistos.has(k));
    if(outros.length) grupos.push(['Outros exercícios', outros]);
    const opts = grupos.map(([g,ks])=>`<optgroup label="${esc(g)}">`+ks.map(k=>`<option value="${esc(k)}"${k===S.exSel?' selected':''}>${esc(NAMES[k]||k)}</option>`).join('')+'</optgroup>').join('');
    const data = series[S.exSel];
    const withKg = data.filter(p=>p.kg!=null && p.kg>0);
    const useKg = withKg.length>0;
    const pts = (useKg? withKg : data).slice(-16).map(p=>({x:p.t, y: useKg? p.kg : p.reps}));
    const rec = useKg ? withKg.reduce((a,b)=> b.kg>a.kg || (b.kg===a.kg && (b.top||0)>(a.top||0)) ? b : a) : null;
    const firstKg = useKg ? withKg[0].kg : null, lastKg = useKg ? withKg[withKg.length-1].kg : null;
    const recent = data.slice(-4).reverse().map(p=>`<li><span>${esc(fmtDate(p.t))}</span>${esc(p.sets.join(' · '))}</li>`).join('');
    exBlock = `<select class="inp" id="exsel" aria-label="Exercício">${opts}</select>
      <div class="statrow">
        <div class="big">${useKg? fmtN(lastKg)+'<small> kg</small>' : (data[data.length-1].reps||0)+'<small> reps</small>'}
        ${useKg && withKg.length>1 && lastKg!==firstKg ? `<span class="delta ${lastKg>firstKg?'good':'neutral'}">${signed(r2(lastKg-firstKg),'kg')} desde ${esc(fmtDate(withKg[0].t))}</span>`:''}</div>
        ${rec ? `<span class="chip">Recorde ${fmtN(rec.kg)} kg × ${rec.top||'–'}</span>`:''}
      </div>
      ${pts.length>1 ? `<p class="note" style="margin-top:4px">${useKg?'Maior carga de cada treino':'Mais repetições de cada treino'}, últimos ${pts.length} registros.</p>${lineChart(pts, useKg?'kg':'reps')}`
        : '<p class="note" style="margin-top:4px">O gráfico aparece a partir do segundo treino com este exercício.</p>'}
      <ul class="rec">${recent}</ul>`;
  }
  return `<section class="card"><h2 class="h2">Cargas por exercício</h2>${exBlock}</section>
    <section class="card" style="margin-top:12px"><h2 class="h2">Treinos por semana</h2>${freq}
      <p class="note" style="margin-top:6px">Linha tracejada: meta de ${meta} treinos. Semanas começam na segunda.</p></section>`;
}
function mLabel(it){ return (MKEYS[it.k] && MKEYS[it.k][0]) || it.l || it.k; }
function mUnit(it){ return it.u!=null && it.u!=='' ? it.u : (MKEYS[it.k] ? MKEYS[it.k][1] : ''); }
function mVal(entry, k){ const it = (entry.items||[]).find(x=>x.k===k); return it ? it.v : null; }
function evoCorpo(){
  const M = S.measures;
  let mBlock;
  const upBtns = `<div class="btns" style="margin-top:4px">
      <button class="btn primary" data-a="aval">${ICON.doc} Enviar avaliação física</button>
      <button class="btn ghost" data-a="mmanual">Digitar medidas</button></div>
    <p class="note">Mande o PDF ou a foto da avaliação. O app lê as medidas e você confere antes de salvar.</p>`;
  if(!M.length){ mBlock = upBtns; }
  else {
    const last = M[M.length-1];
    const latest = {};
    M.forEach(e=>(e.items||[]).forEach(it=>{ const cur = latest[it.k]; latest[it.k] = {it, prev: cur ? cur.it.v : null}; }));
    const heads = MHEAD.filter(k=>latest[k]).slice(0,6);
    const rest = Object.keys(latest).filter(k=>heads.indexOf(k)<0).sort((a,b)=>{ const ia=MORDER.indexOf(a), ib=MORDER.indexOf(b); return (ia<0?999:ia)-(ib<0?999:ib); });
    const show = heads.concat(rest.slice(0, Math.max(0, 6-heads.length)));
    const tiles = show.map(k=>{
      const L = latest[k], it = L.it; const dl = L.prev!=null ? r2(it.v - L.prev) : null;
      return `<button class="mtile" data-a="msel" data-k="${esc(k)}"><span class="k">${esc(mLabel(it))}</span><span class="v">${fmtN(it.v)}<small> ${esc(mUnit(it))}</small></span><span class="dl">${dl?signed(dl):' '}</span></button>`;
    }).join('');
    const keys = Object.keys(latest).sort((a,b)=>{ const ia=MORDER.indexOf(a), ib=MORDER.indexOf(b); return (ia<0?999:ia)-(ib<0?999:ib); });
    if(!S.mSel || keys.indexOf(S.mSel)<0) S.mSel = keys.indexOf('gordura_pct')>=0 ? 'gordura_pct' : keys[0];
    const opts = keys.map(k=>`<option value="${esc(k)}"${k===S.mSel?' selected':''}>${esc(mLabel(latest[k].it))}</option>`).join('');
    const pts = M.filter(e=>mVal(e,S.mSel)!=null).map(e=>({x:new Date(e.d+'T12:00').getTime(), y:mVal(e,S.mSel)}));
    const list = M.slice().reverse().map(e=>`<button class="arow" data-a="mview" data-id="${esc(e.id)}"><span><b>${esc(fmtDay(e.d))}</b><small>${(e.items||[]).length} medidas · ${e.src==='avaliacao'?'avaliação':'manual'}</small></span><span class="chev">›</span></button>`).join('');
    mBlock = `<p class="note" style="margin:0 0 10px">Valor mais recente de cada medida, com a diferença para a medição anterior. Última avaliação: <b style="color:var(--ink)">${esc(fmtDay(last.d))}</b>.</p>
      <div class="mgrid">${tiles}</div>
      <label class="lbl" for="msel">Gráfico</label>
      <select class="inp" id="msel">${opts}</select>
      ${pts.length>1 ? lineChart(pts, mUnit(latest[S.mSel].it)||'') : '<p class="note">O gráfico aparece a partir da segunda avaliação com esta medida.</p>'}
      <h3 class="h3">Avaliações</h3>${list}${upBtns}`;
  }
  const B = S.body, lb = B[B.length-1], fb = B[0];
  const bodyPts = B.slice(-20).map(e=>({x:new Date(e.d+'T12:00').getTime(), y:e.kg}));
  const bodyList = B.slice(-6).reverse().map(e=>`<li><span>${esc(fmtDay(e.d))}</span><b>${fmtN(e.kg)} kg</b><button class="x" data-a="bdel" data-d="${esc(e.d)}" aria-label="Apagar registro de ${esc(e.d)}">×</button></li>`).join('');
  const diff = lb && fb && B.length>1 ? r2(lb.kg - fb.kg) : null;
  const bodyBlock = `
    ${lb ? `<div class="big">${fmtN(lb.kg)}<small> kg</small>${diff ? `<span class="delta neutral">${signed(diff,'kg')} desde ${esc(fmtDay(fb.d))}</span>`:''}</div>` : '<p class="note" style="margin:0 0 4px">Registre seu peso para acompanhar junto com as cargas.</p>'}
    ${bodyPts.length>1 ? lineChart(bodyPts,'kg') : ''}
    <form class="row" id="bform" style="margin-top:14px">
      <input class="inp" id="bkg" inputmode="decimal" autocomplete="off" placeholder="Peso (kg)" aria-label="Peso em kg">
      <input class="inp" type="date" id="bdate" value="${dayKey(Date.now())}" aria-label="Data da pesagem">
    </form>
    <button class="btn" data-a="bsave" style="margin-top:8px">Registrar peso</button>
    ${bodyList?`<ul class="blist">${bodyList}</ul>`:''}`;
  return `<section class="card"><h2 class="h2">Medidas e composição</h2>${mBlock}</section>
    <section class="card" style="margin-top:12px"><h2 class="h2">Peso corporal</h2>${bodyBlock}</section>`;
}
function evoFotos(){
  const P = S.photos;
  const dates = Array.from(new Set(P.map(p=>p.d))).sort();
  let cmp = '';
  if(dates.length>=2){
    const c = S.cmp;
    if(!c.a || dates.indexOf(c.a)<0) c.a = dates[0];
    if(!c.b || dates.indexOf(c.b)<0) c.b = dates[dates.length-1];
    const pa = P.find(p=>p.d===c.a && p.pose===c.pose), pb = P.find(p=>p.d===c.b && p.pose===c.pose);
    const poseBtns = POSES.map(([k,l])=>`<button role="tab" aria-selected="${c.pose===k}" data-a="cpose" data-p="${k}">${l}</button>`).join('');
    const dopts = sel=>dates.map(d=>`<option value="${d}"${d===sel?' selected':''}>${shortDay(d)}</option>`).join('');
    cmp = `<section class="card" style="margin-bottom:12px"><h2 class="h2">Antes e depois</h2>
      <div class="seg" role="tablist" aria-label="Pose">${poseBtns}</div>
      <div class="row" style="margin-bottom:10px"><select class="inp" id="cmp-a" aria-label="Foto de antes">${dopts(c.a)}</select><select class="inp" id="cmp-b" aria-label="Foto de depois">${dopts(c.b)}</select></div>
      ${pa && pb ? `<div class="cmp" id="cmp"><img data-path="${esc(pb.path)}" alt="Depois, ${esc(shortDay(c.b))}"><img class="a" id="cmp-img-a" data-path="${esc(pa.path)}" alt="Antes, ${esc(shortDay(c.a))}">
        <span class="divider" id="cmp-div"></span><span class="tag l">Antes · ${esc(shortDay(c.a))}</span><span class="tag r">Depois · ${esc(shortDay(c.b))}</span></div>
        <input type="range" id="cmp-range" min="0" max="100" value="50" aria-label="Deslize para comparar">`
        : `<p class="note">Falta a foto de ${esc(POSES.find(x=>x[0]===c.pose)[1].toLowerCase())} em ${!pa?shortDay(c.a):shortDay(c.b)}.</p>`}
    </section>`;
  }
  const gal = dates.slice().reverse().map(d=>{
    const items = POSES.map(([k,l])=>{ const p = P.find(x=>x.d===d && x.pose===k); return p ? `<button class="ph" data-a="pview" data-id="${esc(p.id)}"><img data-path="${esc(p.path)}" alt="${l}, ${esc(shortDay(d))}"><span>${l}</span></button>` : `<div class="ph empty-ph"><span>${l}</span></div>`; }).join('');
    return `<h3 class="h3">${esc(fmtDay(d))}</h3><div class="pgrid">${items}</div>`;
  }).join('');
  return `${cmp}<section class="card"><h2 class="h2">Fotos de evolução</h2>
    <button class="btn primary" data-a="pnew">${ICON.cam} Adicionar fotos</button>
    <p class="note">Frente, lado e costas, com a mesma luz e distância, deixam a comparação justa. Só você vê as suas fotos.</p>${gal}</section>`;
}
async function hidratarFotos(){
  const imgs = Array.from(document.querySelectorAll('img[data-path]:not([src])'));
  if(!imgs.length) return;
  const paths = Array.from(new Set(imgs.map(i=>i.dataset.path)));
  try{
    const urls = await D.urlsDasFotos(paths);
    imgs.forEach(i=>{ if(urls[i.dataset.path]) i.src = urls[i.dataset.path]; });
  }catch(e){ /* sem conexão: as fotos aparecem na próxima abertura */ }
}

/* ----- Gráficos ----- */
function lineChart(pts, unit){
  if(!pts.length) return '';
  const W=320, H=150, pl=8, pr=44, pt=16, pb=24;
  const ys = pts.map(p=>p.y);
  const dmin = Math.min.apply(null, ys), dmax = Math.max.apply(null, ys);
  let min=dmin, max=dmax; if(min===max){ min-=1; max+=1; }
  const padv=(max-min)*0.18; min-=padv; max+=padv;
  const X = i => pts.length===1 ? pl+(W-pl-pr)/2 : pl + i*(W-pl-pr)/(pts.length-1);
  const Y = v => pt + (H-pt-pb)*(1-(v-min)/(max-min));
  const line = pts.map((p,i)=>(i?'L':'M')+X(i).toFixed(1)+','+Y(p.y).toFixed(1)).join('');
  const area = line+'L'+X(pts.length-1).toFixed(1)+','+(H-pb)+'L'+X(0).toFixed(1)+','+(H-pb)+'Z';
  const gid = 'g'+Math.random().toString(36).slice(2,7);
  const grids = (dmin===dmax?[dmax]:[dmin,dmax]).map(v=>`<line class="grid" x1="${pl}" x2="${W-pr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="lbl" x="${W-pr+6}" y="${(Y(v)+3.5).toFixed(1)}">${fmtN(v,2)}</text>`).join('');
  const dots = pts.map((p,i)=>`<circle class="pt${i===pts.length-1?' end':''}" cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${i===pts.length-1?4.5:3}"/>`).join('');
  const d0 = new Date(pts[0].x), d1 = new Date(pts[pts.length-1].x);
  const fl = d=>pad(d.getDate())+'/'+pad(d.getMonth()+1);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico em ${esc(unit)} de ${fl(d0)} a ${fl(d1)}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--mint);stop-opacity:.28"/><stop offset="1" style="stop-color:var(--mint);stop-opacity:0"/></linearGradient></defs>
    ${grids}<path d="${area}" fill="url(#${gid})"/><path class="ln" d="${line}"/>${dots}
    <text class="lbl" x="${pl}" y="${H-6}">${fl(d0)}</text>${pts.length>1?`<text class="lbl" x="${W-pr}" y="${H-6}" text-anchor="end">${fl(d1)}</text>`:''}
  </svg>`;
}
function barChart(items, target){
  const W=320, H=130, pl=8, pr=8, pt=14, pb=22;
  const max = Math.max(target, ...items.map(i=>i.y));
  const bw = (W-pl-pr)/items.length;
  const Y = v => pt + (H-pt-pb)*(1-v/max);
  const bars = items.map((it,i)=>{
    const x = pl + i*bw + bw*0.18, w = bw*0.64, y = Y(it.y), h = (H-pb)-y;
    return `<rect class="bar${it.y>=target?' full':''}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(h,0).toFixed(1)}" rx="3"/>
      ${it.y?`<text class="lbl" x="${(x+w/2).toFixed(1)}" y="${(y-4).toFixed(1)}" text-anchor="middle">${it.y}</text>`:''}
      <text class="lbl" x="${(x+w/2).toFixed(1)}" y="${H-6}" text-anchor="middle">${it.lbl}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Treinos por semana nas últimas 8 semanas">
    <line class="grid" x1="${pl}" x2="${W-pr}" y1="${H-pb}" y2="${H-pb}"/>
    <line class="target" x1="${pl}" x2="${W-pr}" y1="${Y(target).toFixed(1)}" y2="${Y(target).toFixed(1)}"/>${bars}</svg>`;
}

/* ---------- Sheets e toast ---------- */
function openSheet(html){ $('#sheet-card').innerHTML = html; $('#sheet').hidden=false; const f=$('#sheet-card button'); if(f) f.focus({preventScroll:true}); hidratarFotos(); }
function closeSheet(force){ if(S.busy && !force) return; $('#sheet').hidden=true; $('#sheet-card').innerHTML=''; S.confirmDel=null; }
let toastT=null;
function toast(msg, err){ const t=$('#toast'); t.textContent=msg; t.className='toast'+(err?' err':''); t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>{t.hidden=true;}, 4200); }

/* ---------- Som e descanso ---------- */
let AC=null, beeps=[], restInt=null;
function unlockAudio(){
  try{ if(!AC){ const C = window.AudioContext||window.webkitAudioContext; if(C) AC = new C(); } if(AC && AC.state==='suspended') AC.resume(); }catch(e){}
}
function cancelBeeps(){ beeps.forEach(o=>{ try{o.stop(0);}catch(e){} try{o.disconnect();}catch(e){} }); beeps=[]; }
function scheduleBeeps(sec){
  cancelBeeps(); if(!S.sound || !AC) return;
  try{
    const t0 = AC.currentTime + Math.max(0, sec);
    [[0,880],[0.22,880],[0.44,1320]].forEach(([o,f])=>{
      const osc = AC.createOscillator(), g = AC.createGain();
      osc.type='sine'; osc.frequency.value=f;
      g.gain.setValueAtTime(0.0001, t0+o); g.gain.exponentialRampToValueAtTime(0.3, t0+o+0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0+o+0.18);
      osc.connect(g); g.connect(AC.destination); osc.start(t0+o); osc.stop(t0+o+0.2); beeps.push(osc);
    });
  }catch(e){}
}
function startRest(sec, label){
  unlockAudio();
  S.rest = {end: Date.now()+sec*1000, total: sec, label, over:false};
  scheduleBeeps(sec);
  $('#rest').hidden=false; $('#rest').classList.remove('over');
  clearInterval(restInt); restInt = setInterval(tickRest, 250); tickRest();
}
function stopRest(){ clearInterval(restInt); restInt=null; S.rest=null; cancelBeeps(); $('#rest').hidden=true; }
function tickRest(){
  const r = S.rest; if(!r) return;
  const left = (r.end - Date.now())/1000;
  const el = $('#rest');
  if(left<=0){
    if(!r.over){
      r.over = true; r.overAt = Date.now(); el.classList.add('over');
      try{ navigator.vibrate && navigator.vibrate([220,100,220]); }catch(e){}
      setTimeout(()=>{ if(S.rest===r && r.over && Date.now()-r.overAt>=7900) stopRest(); }, 8000);
    }
    $('#rest-lbl').textContent = 'Descanso concluído · próxima série';
    $('#rest-time').textContent = '+'+clock(-left);
    $('#rest-fill').style.width = '0%';
    return;
  }
  $('#rest-lbl').textContent = 'Descanso · '+r.label;
  $('#rest-time').textContent = clock(Math.ceil(left));
  $('#rest-fill').style.width = (left/r.total*100)+'%';
}
function tickClock(){
  if(!S.draft) return;
  const t = elapsed(Date.now()-S.draft.start);
  const e = $('#elapsed'); if(e) e.textContent = t;
  const l = $('#live-txt'); if(l) l.textContent = 'Treino '+S.draft.letter+' em andamento · '+t;
}
setInterval(tickClock, 1000);

/* ---------- Ações de treino ---------- */
function go(v){ S.view = v; render(); window.scrollTo(0,0); }
function touchDraft(){ if(S.draft) S.draft.at = Date.now(); LS.set(kDraft(), S.draft); D.salvarRascunho(UID, S.draft); }
let wakeLock = null;
async function pedirTelaAcesa(){ try{ if(navigator.wakeLock && !wakeLock){ wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', ()=>{ wakeLock=null; }); } }catch(e){} }
function startWorkout(L){
  if(S.draft && (S.draft.letter!==L || S.draft.planId!==FICHA.id)){
    openSheet(`<h2>Já existe um treino em andamento</h2><p>O Treino ${esc(S.draft.letter)} ainda não foi finalizado. O que você quer fazer?</p>
      <div class="btns"><button class="btn primary" data-a="go-close" data-v="sessao">Continuar o Treino ${esc(S.draft.letter)}</button>
      <button class="btn danger" data-a="force-start" data-l="${L}">Descartar o ${esc(S.draft.letter)} e começar o ${L}</button>
      <button class="btn ghost" data-a="close">Cancelar</button></div>`);
    return;
  }
  if(!S.draft){ S.draft = newDraft(L); touchDraft(); }
  unlockAudio(); pedirTelaAcesa();
  go('sessao');
}
function toggleSet(i, si){
  const d = S.draft; if(!d) return;
  const e = d.w.ex[i], st = d.ex[i].sets[si];
  if(!st.done){
    e.parts.forEach((pn,pi)=>{
      const p = st.p[pi];
      ['kg','r'].forEach(f=>{
        const inp = $('#'+(f==='kg'?'w':'r')+'-'+i+'-'+si+'-'+pi);
        if(p[f]==='' && inp && inp.dataset.ph){ p[f] = inp.dataset.ph.replace(',','.'); inp.value = inp.dataset.ph; }
      });
    });
    st.done = true; d.lastSetAt = Date.now();
  } else st.done = false;
  touchDraft();
  const row = $('#set-'+i+'-'+si);
  if(row){ row.classList.toggle('done', st.done); const b=row.querySelector('.chk'); if(b) b.setAttribute('aria-pressed', String(st.done)); }
  updateProgress();
  if(st.done){
    const c = countDone(d);
    if(c.sets < c.total){
      const exDone = d.ex[i].sets.every(s=>s.done);
      const label = exDone && i+1 < d.ex.length ? 'próximo: '+d.w.ex[i+1].n.toLowerCase() : e.n.toLowerCase();
      startRest(e.rest, label);
    } else { stopRest(); toast('Todas as séries feitas. Toque em Finalizar treino.'); }
  } else if(S.rest) { stopRest(); }
}
function addSet(i){
  const d = S.draft; const e = d.w.ex[i];
  d.ex[i].sets.push({done:false, p:e.parts.map(()=>({kg:'',r:''}))});
  touchDraft();
  const card = $('#ex-'+i);
  if(card){ const tmp = document.createElement('div'); tmp.innerHTML = exCard(e,i); card.replaceWith(tmp.firstElementChild); }
  updateProgress();
}
/* Trocar exercício só neste treino */
function refreshCard(i){ const card = $('#ex-'+i); if(card){ const tmp = document.createElement('div'); tmp.innerHTML = exCard(S.draft.w.ex[i], i); card.replaceWith(tmp.firstElementChild); } }
function swapSheet(i){
  const d = S.draft, e = d.w.ex[i], base = e.orig || e;
  const N = nomeDeChave();
  const nomes = [...new Set(Object.values(N))].filter(n=>n && slug(n)!==e.key).sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const feitas = d.ex[i].sets.filter(st=>st.done).length;
  openSheet(`<h2>Trocar exercício</h2><p>Aparelho ocupado ou com problema? A troca vale só para este treino. A ficha continua igual.</p>
    <p class="note" style="margin-top:0">Na ficha: <b>${esc(base.n)}</b></p>
    <label class="lbl" for="swap-n">Fazer no lugar</label>
    <input class="inp" id="swap-n" list="swap-list" autocomplete="off" placeholder="Ex.: Supino com halteres">
    <datalist id="swap-list">${nomes.map(n=>`<option value="${esc(n)}"></option>`).join('')}</datalist>
    <p class="note">Mantém ${base.s} séries de ${range(base.r)} reps e ${restTxt(base.rest)} de descanso. O app sugere a carga se você já fez esse exercício antes.${feitas?` <b>As ${feitas} séries já marcadas aqui serão apagadas.</b>`:''}</p>
    <div class="btns"><button class="btn primary" data-a="swap-go" data-ei="${i}">${ICON.swap} Trocar</button>${e.orig?`<button class="btn" data-a="swap-undo" data-ei="${i}">Voltar para ${esc(base.n)}</button>`:''}<button class="btn ghost" data-a="close">Cancelar</button></div>`);
  const inp = $('#swap-n'); if(inp) inp.focus();
}
function swapEx(i, nome){
  const d = S.draft, atual = d.w.ex[i], base = atual.orig || atual;
  nome = String(nome||'').trim().replace(/\s+/g,' ');
  if(!nome){ toast('Digite o exercício que você vai fazer.', true); return; }
  const k = slug(nome);
  if(k===base.key){ undoSwap(i); return; }
  const o = copia(base); delete o.orig;
  d.w.ex[i] = { n:nome, parts:[nome], bi:false, keys:[k], key:k, incs:[chutarAumento(nome)], s:base.s, r:base.r.slice(), rest:base.rest, tip:'', video:'', orig:o };
  d.ex[i].sets = Array.from({length:base.s}, ()=>({done:false, p:[{kg:'',r:''}]}));
  touchDraft(); closeSheet(true); refreshCard(i); updateProgress();
  toast('Trocado só neste treino.');
}
function undoSwap(i){
  const d = S.draft, o = d.w.ex[i].orig; if(!o) return;
  d.w.ex[i] = o;
  d.ex[i].sets = Array.from({length:o.s}, ()=>({done:false, p:o.parts.map(()=>({kg:'',r:''}))}));
  touchDraft(); closeSheet(true); refreshCard(i); updateProgress();
  toast('Voltou para '+o.n+'.');
}
function buildSession(){
  const d = S.draft, now = Date.now();
  const end = d.lastSetAt && (now - d.lastSetAt > 15*60*1000) ? d.lastSetAt + 60*1000 : now;
  const ex = [];
  d.w.ex.forEach((e,i)=>{
    const sets = d.ex[i].sets.filter(s=>s.done).map(s=>({p:s.p.map(p=>({kg:num(p.kg), r:num(p.r)}))}));
    if(sets.length) ex.push(Object.assign({key:e.key, keys:e.keys, n:e.n, parts:e.parts, sets}, e.orig ? {era:e.orig.n} : {}));
  });
  const c = countDone(d);
  return { id:d.id || (d.id = uuid()), planId:d.planId, letter:d.letter, wname:d.w.name, start:d.start, end, dur:Math.round((end-d.start)/1000),
    notes:(d.notes||'').trim(), ex, vol:sessionVolume(ex), done:c.sets, total:c.total };
}
function findPRs(s){
  const N = nomeDeChave();
  const best = bestByKey(s.start); const out=[];
  s.ex.forEach(e=>e.keys.forEach((k,i)=>{
    let m=null; e.sets.forEach(st=>{ const kg=st.p[i]&&st.p[i].kg; if(kg!=null && (m==null||kg>m)) m=kg; });
    if(m!=null && best[k]!=null && m>best[k]) out.push((N[k]||e.n)+' '+fmtN(m)+' kg (antes '+fmtN(best[k])+')');
  }));
  return out;
}
function finishPrompt(){
  const d = S.draft; const c = countDone(d);
  if(!c.sets){
    openSheet(`<h2>Nenhuma série marcada</h2><p>Marque as séries que você fez com o botão ✓ ou descarte o treino.</p>
      <div class="btns"><button class="btn primary" data-a="close">Voltar ao treino</button></div>`); return;
  }
  const s = buildSession(); const prs = findPRs(s);
  openSheet(`<h2>Finalizar Treino ${esc(d.letter)}?</h2><p>${c.sets} de ${c.total} séries feitas.${c.sets<c.total?' As séries não marcadas não entram no registro.':''}</p>
    <div class="sum"><div class="tile"><div class="k">Tempo</div><div class="v">${mins(s.dur)}<small> min</small></div></div>
    <div class="tile"><div class="k">Séries</div><div class="v">${c.sets}<small>/${c.total}</small></div></div>
    <div class="tile"><div class="k">Volume</div><div class="v">${fmtInt(s.vol)}<small> kg</small></div></div></div>
    ${prs.length?`<ul class="prs">${prs.map(p=>`<li>Recorde: ${esc(p)}</li>`).join('')}</ul>`:''}
    <div class="btns"><button class="btn primary" data-a="save">Salvar treino</button><button class="btn ghost" data-a="close">Continuar treinando</button></div>`);
}
async function saveSession(){
  const s = buildSession(); const prs = findPRs(s);
  const antes = new Set(minhasConquistas().filter(c=>c.at).map(c=>c.id));
  S.sessions = [s].concat(S.sessions.filter(x=>x.id!==s.id)).sort((a,b)=>b.start-a.start);
  const novas = minhasConquistas().filter(c=>c.at && !antes.has(c.id));
  S.pending = S.pending.filter(p=>p.id!==s.id).concat([s]); LS.set(kPending(), S.pending);
  S.draft = null; LS.set(kDraft(), null); D.apagarRascunho(UID);
  stopRest(); closeSheet(true);
  const L = s.letter, ord = FICHA ? FICHA.order : [L];
  const nx = ord[(ord.indexOf(L)+1)%ord.length];
  go('hoje');
  const nv0 = nivel(S.sessions.length-1), nv1 = nivel(S.sessions.length);
  const extra = (nv1.i>nv0.i ? ' Subiu para o nível '+nv1.nome+'!' : '') + (novas.length ? ' Nova conquista: '+novas.map(c=>c.ico+' '+c.nome).join(', ')+'.' : '');
  abrirCompartilhar('semana', s, 'Treino '+L+' salvo! Próximo: Treino '+nx+'.'+(prs.length?' '+prs.length+(prs.length>1?' recordes':' recorde')+' hoje.':'')+extra,
    novas.length ? novas[novas.length-1].nome : (nv1.i>nv0.i ? 'Nível '+nv1.nome : null));
  await enviarPendentes();
}
async function enviarPendentes(){
  if(!S.pending.length){ if(!S.offline && S.sync!=='saving'){ S.sync = 'ok'; renderStatus(); } return; }
  S.sync = 'saving'; renderStatus();
  for(const s of S.pending.slice()){
    try{ await D.salvarTreino(UID, s); S.pending = S.pending.filter(p=>p.id!==s.id); LS.set(kPending(), S.pending); }
    catch(e){ S.sync = 'offline'; renderStatus(); return; }
  }
  S.sync = 'ok'; renderStatus(); guardarCache();
  if(S.view==='historico') render();
}
function discardPrompt(){
  openSheet(`<h2>Descartar o Treino ${esc(S.draft.letter)}?</h2><p>As séries marcadas neste treino serão apagadas. Isso não pode ser desfeito.</p>
    <div class="btns"><button class="btn danger" data-a="discard-yes">Descartar treino</button><button class="btn ghost" data-a="close">Cancelar</button></div>`);
}
function discard(){ S.draft=null; LS.set(kDraft(), null); D.apagarRascunho(UID); stopRest(); closeSheet(true); go('hoje'); }
function histDetail(id){
  const s = S.sessions.find(x=>x.id===id); if(!s) return;
  const ex = (s.ex||[]).map(e=>{
    const parts = e.parts || [e.n];
    const body = parts.length===1 ? e.sets.map(st=>setTxt(st,0)).join(' · ') : parts.map((n,i)=>esc(n)+': '+e.sets.map(st=>setTxt(st,i)).join(', ')).join('<br>');
    return `<div class="dex"><b>${esc(e.n)}</b><div>${body}</div></div>`;
  }).join('');
  openSheet(`<h2>Treino ${esc(s.letter)} · ${esc(s.wname)}</h2><p style="text-transform:capitalize">${esc(fmtDate(s.start))}, ${hhmm(s.start)}</p>
    <div class="sum"><div class="tile"><div class="k">Tempo</div><div class="v">${mins(s.dur)}<small> min</small></div></div>
    <div class="tile"><div class="k">Séries</div><div class="v">${s.done}<small>/${s.total}</small></div></div>
    <div class="tile"><div class="k">Volume</div><div class="v">${fmtInt(s.vol)}<small> kg</small></div></div></div>
    ${ex}${s.notes?`<div class="dex"><b>Observações</b><div>${esc(s.notes)}</div></div>`:''}
    <div class="btns" style="margin-top:14px"><button class="btn primary" data-a="share" data-t="semana" data-id="${esc(s.id)}">${ICON.share} Compartilhar imagem</button><button class="btn" data-a="copy" data-id="${esc(s.id)}">Copiar resumo</button>
    <button class="btn danger" data-a="hdel" data-id="${esc(s.id)}">Excluir este treino</button>
    <button class="btn ghost" data-a="close">Fechar</button></div>`);
}
function summaryText(s){
  const lines = ['Treino '+s.letter+' – '+s.wname+' · '+fmtDate(s.start)+' · '+mins(s.dur)+' min'];
  (s.ex||[]).forEach((e,i)=>{
    const parts = e.parts||[e.n];
    const t = parts.length===1 ? e.sets.map(st=>setTxt(st,0)).join(', ') : parts.map((n,pi)=>n+' '+e.sets.map(st=>setTxt(st,pi)).join(', ')).join(' | ');
    lines.push((i+1)+'. '+e.n+': '+t);
  });
  lines.push('Volume: '+fmtInt(s.vol)+' kg · '+s.done+'/'+s.total+' séries');
  if(s.notes) lines.push('Obs.: '+s.notes);
  return lines.join('\n');
}
async function deleteSession(id){
  const antes = S.sessions;
  S.sessions = S.sessions.filter(s=>s.id!==id);
  S.pending = S.pending.filter(s=>s.id!==id); LS.set(kPending(), S.pending);
  closeSheet(true); render();
  try{ await D.apagarTreino(id); toast('Treino excluído.'); }
  catch(e){ S.sessions = antes; render(); toast('Não consegui excluir agora. Confira a conexão.', true); }
}
async function saveBody(){
  const kg = num($('#bkg').value); const d = $('#bdate').value || dayKey(Date.now());
  if(kg==null || kg<20 || kg>400){ toast('Digite o peso em kg, por exemplo 72,5.', true); $('#bkg').focus(); return; }
  try{
    await D.salvarPeso(UID, d, kg);
    S.body = S.body.filter(e=>e.d!==d).concat([{d, kg}]).sort((a,b)=>a.d<b.d?-1:1);
    render(); toast('Peso registrado: '+fmtN(kg)+' kg.');
  }catch(e){ toast('Não consegui salvar o peso. Confira a conexão.', true); }
}

/* ---------- Arquivos: imagens e PDF para a leitura ---------- */
async function toJpeg(blob, maxSide, q){
  const url = URL.createObjectURL(blob);
  try{
    const img = await new Promise((res, rej)=>{ const i = new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
    const s = Math.min(1, maxSide/Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth*s); c.height = Math.round(img.naturalHeight*s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise(r=>c.toBlob(r, 'image/jpeg', q));
  } finally { URL.revokeObjectURL(url); }
}
function base64(blob){
  return new Promise((res, rej)=>{ const r = new FileReader(); r.onload=()=>res(String(r.result).split(',')[1]); r.onerror=rej; r.readAsDataURL(blob); });
}
async function prepararArquivos(files){
  const out = [];
  for(const f of files.slice(0,6)){
    if(f.type==='application/pdf' || /\.pdf$/i.test(f.name||'')){
      if(f.size > 9*1024*1024) throw {code:'grande_demais'};
      out.push({type:'application/pdf', data: await base64(f)});
    } else {
      const j = await toJpeg(f, 2000, 0.88);
      out.push({type:'image/jpeg', data: await base64(j)});
    }
  }
  return out;
}
function erroLeitura(c){
  return c==='sem_chave' ? 'A leitura automática ainda não foi ligada no servidor (falta a chave da API do Claude).' :
    c==='chave_invalida' ? 'A chave da API do Claude no servidor está inválida.' :
    c==='limite' ? 'Muitas leituras seguidas. Tente de novo daqui a pouco.' :
    c==='grande_demais' ? 'Arquivo grande demais. Mande um PDF menor ou fotos.' :
    c==='json' ? 'A leitura saiu incompleta. Tente de novo com uma foto mais nítida.' :
    c==='rede' ? 'Sem conexão com o servidor. Confira a internet.' :
    'Não consegui ler o arquivo agora.';
}
function sheetLendo(titulo){
  openSheet(`<div class="loading"><div class="spin" aria-hidden="true"></div><h2>${esc(titulo)}</h2><p id="read-st">Preparando o arquivo…</p></div>`);
}

/* ----- Avaliação ----- */
function cleanItems(arr){
  const seen = {};
  return (Array.isArray(arr)?arr:[]).map(x=>{
    let k = keyOf(x && (x.k || x.rotulo) || '');
    const v = num(x && x.v);
    if(!k || v==null) return null;
    if(seen[k]){ seen[k]++; k = k+'_'+seen[k]; } else seen[k]=1;
    return {k, l:String(x.rotulo||x.l||'').slice(0,60), v, u:String(x.u==null?'':x.u).slice(0,8)};
  }).filter(Boolean);
}
async function readAvaliacao(files){
  S.busy = true; sheetLendo('Lendo a avaliação');
  try{
    const arquivos = await prepararArquivos(files);
    const st = $('#read-st'); if(st) st.textContent = 'Lendo as medidas. Leva até um minuto.';
    const out = await D.lerDocumento('avaliacao', arquivos);
    const items = cleanItems(out && out.itens);
    S.busy = false;
    if(!items.length){ openManual('Não encontrei medidas nesse arquivo. Confira se é a avaliação certa ou preencha abaixo.'); return; }
    const d = out && typeof out.data==='string' && /^\d{4}-\d{2}-\d{2}$/.test(out.data) ? out.data : dayKey(Date.now());
    S.mreview = {d, items, src:'avaliacao', dateFound: !!(out && out.data)};
    openReview();
  }catch(e){ S.busy = false; openManual(erroLeitura(e && e.code)+' Preencha as medidas abaixo.'); }
}
function openManual(note){
  S.busy = false;
  S.mreview = {d:dayKey(Date.now()), items:MMANUAL.map(k=>({k, l:MKEYS[k][0], v:null, u:MKEYS[k][1]})), src:'manual', note};
  openReview();
}
function openReview(){
  const R = S.mreview;
  const rows = R.items.map((it,i)=>`<div class="mrow">
      <input type="checkbox" id="mc-${i}" ${R.src==='manual'?'':'checked'} aria-label="Salvar ${esc(mLabel(it))}">
      <label for="mv-${i}">${esc(mLabel(it))}${it.l && MKEYS[it.k] && it.l.toLowerCase()!==MKEYS[it.k][0].toLowerCase() ? `<small>${esc(it.l)}</small>`:''}</label>
      <input class="inp sm" id="mv-${i}" inputmode="decimal" autocomplete="off" value="${it.v!=null?esc(fmtN(it.v,3)):''}">
      <span class="u">${esc(mUnit(it))}</span></div>`).join('');
  const hasPeso = R.items.some(x=>x.k==='peso');
  openSheet(`<h2>${R.src==='manual'?'Digitar medidas':'Confira as medidas'}</h2>
    <p>${R.note ? esc(R.note) : `Li ${R.items.length} medidas. Corrija o que estiver diferente do papel antes de salvar.`}</p>
    <label class="lbl" for="mdate" style="margin-top:4px">Data da avaliação${R.src==='avaliacao' && !R.dateFound?' (não achei no arquivo, confira)':''}</label>
    <input class="inp" type="date" id="mdate" value="${esc(R.d)}">
    <div class="mrows">${rows}</div>
    ${hasPeso?'<p class="note">O peso também entra no gráfico de peso corporal.</p>':''}
    <div class="btns" style="margin-top:14px"><button class="btn primary" data-a="msave">Salvar avaliação</button><button class="btn ghost" data-a="close">Cancelar</button></div>`);
}
async function saveReview(){
  const R = S.mreview; if(!R) return;
  const d = $('#mdate').value || R.d;
  const items = [];
  R.items.forEach((it,i)=>{
    const v = num($('#mv-'+i).value);
    const on = $('#mc-'+i).checked || (R.src==='manual' && v!=null);
    if(on && v!=null) items.push({k:it.k, l:it.l, v, u:mUnit(it)});
  });
  if(!items.length){ toast('Preencha pelo menos uma medida.', true); return; }
  const btn = document.querySelector('[data-a="msave"]'); if(btn) btn.disabled = true;
  try{
    const salvo = await D.salvarAvaliacao(UID, {d, src:R.src, items});
    S.measures = S.measures.concat([salvo]).sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:(a.t||0)-(b.t||0));
    const peso = items.find(x=>x.k==='peso');
    if(peso && !S.body.some(b=>b.d===d)){ try{ await D.salvarPeso(UID, d, peso.v); S.body = S.body.concat([{d, kg:peso.v}]).sort((a,b)=>a.d<b.d?-1:1); }catch(e){} }
    S.mreview = null; S.mSel = null;
    closeSheet(true); S.evoTab='corpo'; render(); toast('Avaliação salva com '+items.length+' medidas.');
  }catch(e){ if(btn) btn.disabled = false; toast('Não consegui salvar a avaliação. Confira a conexão.', true); }
}
function measureDetail(id){
  const e = S.measures.find(x=>x.id===id); if(!e) return;
  const idx = S.measures.indexOf(e), prev = idx>0 ? S.measures[idx-1] : null;
  const rows = e.items.map(it=>{ const pv = prev ? mVal(prev,it.k) : null; const dl = pv!=null ? r2(it.v-pv) : null;
    return `<li><span>${esc(mLabel(it))}</span><b>${fmtN(it.v)} ${esc(mUnit(it))}</b><em>${dl?signed(dl):''}</em></li>`; }).join('');
  openSheet(`<h2>Avaliação de ${esc(fmtDay(e.d))}</h2><p>${e.items.length} medidas${prev?' · diferença em relação a '+esc(shortDay(prev.d)):''}</p>
    <ul class="mlist">${rows}</ul>
    <div class="btns" style="margin-top:14px"><button class="btn danger" data-a="mdel" data-id="${esc(e.id)}">Excluir esta avaliação</button><button class="btn ghost" data-a="close">Fechar</button></div>`);
}

/* ----- Leitura da ficha ----- */
async function readFicha(files){
  S.busy = true; sheetLendo('Lendo a ficha');
  try{
    const arquivos = await prepararArquivos(files);
    const st = $('#read-st'); if(st) st.textContent = 'Montando os treinos. Leva até um minuto.';
    const out = await D.lerDocumento('ficha', arquivos);
    const f = fichaDaLeitura(out);
    S.busy = false; closeSheet(true);
    if(!f.order.length){ toast('Não encontrei treinos nesse arquivo. Tente uma foto mais nítida ou monte do zero.', true); return; }
    f.aviso = 'Li '+f.order.length+' treinos da sua ficha. Confira nomes, séries, repetições e descansos antes de salvar.';
    abrirEditor(f, 'onboarding');
  }catch(e){ S.busy = false; closeSheet(true); toast(erroLeitura(e && e.code)+' Você pode montar a ficha do zero.', true); }
}

/* ----- Fotos ----- */
function openPhotoSheet(){
  const P = S.pnew;
  const slots = POSES.map(([k,l])=>{ const f = P.files[k]; return `<button class="ph slot" data-a="pslot" data-p="${k}">${f?`<img src="${esc(f.url)}" alt="${l} escolhida">`:`<i>+</i>`}<span>${l}</span></button>`; }).join('');
  const n = Object.keys(P.files).length;
  openSheet(`<h2>Novas fotos</h2><p>Escolha uma foto para cada pose. Pode tirar na hora ou pegar da galeria.</p>
    <label class="lbl" for="pdate" style="margin-top:4px">Data</label>
    <input class="inp" type="date" id="pdate" value="${esc(P.d)}">
    <div class="pgrid" style="margin-top:12px">${slots}</div>
    <p class="note" id="pst"></p>
    <div class="btns" style="margin-top:10px"><button class="btn primary" data-a="psave"${n?'':' disabled'}>Salvar ${n||''} ${n===1?'foto':'fotos'}</button><button class="btn ghost" data-a="pcancel">Cancelar</button></div>`);
}
function clearPnew(){ if(S.pnew) Object.values(S.pnew.files).forEach(f=>{ try{ URL.revokeObjectURL(f.url); }catch(e){} }); S.pnew = null; }
async function savePhotos(){
  const P = S.pnew; const entries = Object.entries(P.files);
  S.busy = true;
  const btn = document.querySelector('[data-a="psave"]'); if(btn) btn.disabled = true;
  let ok = 0;
  try{
    for(let i=0;i<entries.length;i++){
      const [pose, f] = entries[i];
      const el = $('#pst'); if(el) el.textContent = 'Enviando '+(i+1)+' de '+entries.length+'…';
      const blob = await toJpeg(f.file, 1600, 0.85);
      const antiga = S.photos.find(p=>p.d===P.d && p.pose===pose);
      const nova = await D.enviarFoto(UID, P.d, pose, blob, antiga);
      S.photos = S.photos.filter(p=>!(p.d===P.d && p.pose===pose)).concat([nova]).sort((a,b)=>a.d<b.d?-1:1);
      ok++;
    }
  }catch(e){ toast(ok ? 'Salvei '+ok+' foto(s), mas uma falhou. Tente de novo.' : 'Não consegui enviar as fotos. Confira a conexão.', true); }
  S.busy = false;
  if(ok) S.cmp.b = null;
  clearPnew(); closeSheet(true); S.evoTab='fotos'; render();
  if(ok===entries.length) toast(ok+(ok>1?' fotos salvas.':' foto salva.'));
}
function photoView(id){
  const p = S.photos.find(x=>x.id===id); if(!p) return;
  const l = (POSES.find(x=>x[0]===p.pose)||['',''])[1];
  openSheet(`<h2>${esc(l)} · ${esc(fmtDay(p.d))}</h2>
    <img class="pbig" data-path="${esc(p.path)}" alt="${esc(l)}, ${esc(shortDay(p.d))}">
    <div class="btns" style="margin-top:12px"><button class="btn danger" data-a="pdel" data-id="${esc(p.id)}">Excluir foto</button><button class="btn ghost" data-a="close">Fechar</button></div>`);
}
async function deletePhoto(id){
  const p = S.photos.find(x=>x.id===id); if(!p) return;
  try{ await D.apagarFoto(p); S.photos = S.photos.filter(x=>x.id!==id); closeSheet(true); render(); toast('Foto excluída.'); }
  catch(e){ toast('Não consegui excluir a foto agora.', true); }
}

/* ----- Conta e fichas ----- */
function perfilSheet(){
  const ini = (NOME||EMAIL||'?').trim().split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase();
  openSheet(`<div class="perfil-h"><button class="avatar xl" data-a="p-foto" aria-label="Trocar foto de perfil">${AVATAR?`<img data-path="${esc(AVATAR)}" alt="Sua foto">`:esc(ini)}<span class="cam">${ICON.cam}</span></button>
      <div><h2>${esc(NOME||'Sua conta')}</h2><p style="margin:0">${esc(EMAIL)}</p>${INSTA?`<p class="insta">@${esc(INSTA)}</p>`:''}</div></div>
    <label class="lbl" for="p-nome">Seu nome</label>
    <input class="inp" id="p-nome" value="${esc(NOME)}" autocomplete="name">
    <label class="lbl" for="p-insta">Instagram (opcional)</label>
    <div class="fld-at"><span>@</span><input class="inp" id="p-insta" value="${esc(INSTA)}" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="seuusuario"></div>
    <p class="note">A foto e o @ aparecem nas imagens que você compartilha.</p>
    <button class="btn" data-a="p-save" style="margin-top:10px">Salvar perfil</button>
    <div class="btns" style="margin-top:16px">
      <button class="btn" data-a="grupo">${ICON.users} Grupo da família${S.grupo?' · '+esc(S.grupo.nome):''}</button>
      ${EDITOR?`<button class="btn" data-a="videos">${ICON.play} Vídeos dos exercícios</button>`:''}
      ${FICHA?`<button class="btn" data-a="lembretes">${ICON.bell} Lembretes no calendário</button><button class="btn" data-a="f-edit">${ICON.edit} Editar ficha atual</button><button class="btn" data-a="fichas">Trocar de ficha</button>`:''}
      <button class="btn danger" data-a="sair">Sair da conta</button>
      <button class="btn ghost" data-a="close">Fechar</button></div>`);
}
function fichasSheet(){
  const rows = FICHAS.slice().reverse().map(f=>`<div class="frow-f${f.id===FICHA.id?' on':''}">
      <span><b>${esc(f.nome)}</b><small>${(f.order||[]).length} treinos${f.id===FICHA.id?' · em uso':''}</small></span>
      ${f.id===FICHA.id ? '<span class="chip ok">Em uso</span>' : `<span class="ff-b"><button class="btn sm" data-a="f-usar" data-id="${esc(f.id)}">Usar</button><button class="mini del" data-a="f-apagar" data-id="${esc(f.id)}" aria-label="Apagar ficha ${esc(f.nome)}">×</button></span>`}
    </div>`).join('');
  openSheet(`<h2>Suas fichas</h2><p>O histórico de treinos continua guardado quando você troca de ficha.</p>
    <div class="flist">${rows}</div>
    <div class="btns" style="margin-top:14px"><button class="btn" data-a="go-close" data-v="onboarding">+ Nova ficha</button><button class="btn ghost" data-a="close">Fechar</button></div>`);
}

/* ---------- Compartilhar (imagem da semana ou do mês) ---------- */
const CARD = { tipo:'semana', ref:null, titulo:'', conquista:null, blob:null, url:null };
function dadosSemana(ref){
  const base = ref ? ref.start : Date.now();
  const wk = startOfWeek(base), fim = wk + 7*864e5;
  const doSemana = S.sessions.filter(s=>s.start>=wk && s.start<fim);
  const dias = SEMANA.map((wd,i)=>({ label:WD[wd][0], feito: doSemana.some(s=>sameDay(s.start, wk+i*864e5)), futuro: wk+i*864e5 > Date.now(), hoje: sameDay(wk+i*864e5, Date.now()) }));
  return { ref, data: ref ? ref.start : Date.now(), dias, nDias: dias.filter(d=>d.feito).length,
    tempoSemana: doSemana.reduce((n,s)=>n+(s.dur||0),0), treinosSemana: doSemana.length, volSemana: doSemana.reduce((n,s)=>n+(s.vol||0),0), nome: NOME || EMAIL.split('@')[0], insta: INSTA };
}
function dadosMes(ref){
  const base = new Date(ref ? ref.start : Date.now());
  const ano = base.getFullYear(), mes = base.getMonth();
  const doMes = S.sessions.filter(s=>{ const d=new Date(s.start); return d.getFullYear()===ano && d.getMonth()===mes; });
  const feitos = new Set(doMes.map(s=>new Date(s.start).getDate()));
  return { ano, mes, feitos, nDias: feitos.size, tempo: doMes.reduce((n,s)=>n+(s.dur||0),0), treinos: doMes.length, data: Date.now(), nome: NOME || EMAIL.split('@')[0], insta: INSTA };
}
async function abrirCompartilhar(tipo, ref, titulo, conquista){
  CARD.tipo = tipo; CARD.ref = ref || null; CARD.titulo = titulo || ''; CARD.conquista = conquista || null;
  if(CARD.url){ try{ URL.revokeObjectURL(CARD.url); }catch(e){} CARD.url = null; }
  CARD.blob = null;
  const tabs = `<div class="seg two" role="tablist"><button role="tab" aria-selected="${tipo==='semana'}" data-a="share-tab" data-t="semana">Semana</button><button role="tab" aria-selected="${tipo==='mes'}" data-a="share-tab" data-t="mes">Mês</button></div>`;
  openSheet(`<h2>${esc(titulo || 'Compartilhar')}</h2><p>Imagem pronta para o story ou o WhatsApp.</p>${tabs}
    <div class="cardprev" id="cardprev"><div class="spin" aria-hidden="true"></div></div>
    <div class="btns" style="margin-top:12px"><button class="btn primary" data-a="share-go" id="share-go" disabled>${ICON.share} Compartilhar</button>
    <a class="btn ghost" id="share-dl" download="treino.png" aria-disabled="true">Baixar imagem</a>
    <button class="btn ghost" data-a="close">Fechar</button></div>`);
  try{
    const foto = await fotoParaCartao();
    const canvas = tipo==='mes' ? await desenharMes(Object.assign(dadosMes(ref), {foto})) : await desenharSemana(Object.assign(dadosSemana(ref), {foto, conquista: ref ? CARD.conquista : null}));
    const blob = await new Promise(r=>canvas.toBlob(r, 'image/png'));
    if(CARD.tipo!==tipo || CARD.ref!==(ref||null)) return;
    CARD.blob = blob; CARD.url = URL.createObjectURL(blob);
    const prev = $('#cardprev'); if(prev) prev.innerHTML = `<img src="${CARD.url}" alt="Imagem para compartilhar">`;
    const dl = $('#share-dl'); if(dl){ dl.href = CARD.url; dl.download = (tipo==='mes'?'meus-treinos-mes':'meus-treinos-semana')+'.png'; dl.removeAttribute('aria-disabled'); }
    const go = $('#share-go'); if(go) go.disabled = false;
  }catch(e){ const prev = $('#cardprev'); if(prev) prev.innerHTML = '<p class="note">Não consegui gerar a imagem agora.</p>'; }
}
async function fotoParaCartao(){
  if(!AVATAR) return null;
  if(AVATAR_IMG && AVATAR_IMG.path===AVATAR) return AVATAR_IMG.img;
  try{ const blob = await D.baixarFoto(AVATAR); const img = await createImageBitmap(blob); AVATAR_IMG = {path:AVATAR, img}; return img; }catch(e){ return null; }
}
async function trocarAvatar(file){
  toast('Enviando foto…');
  try{
    const quadrada = await recortarQuadrado(file, 512);
    const antigo = AVATAR;
    AVATAR = await D.enviarAvatar(UID, quadrada, antigo);
    AVATAR_IMG = null;
    closeSheet(true); render(); perfilSheet(); toast('Foto de perfil atualizada.');
  }catch(e){ toast('Não consegui enviar a foto. Tente outra imagem.', true); }
}
async function recortarQuadrado(blob, lado){
  const url = URL.createObjectURL(blob);
  try{
    const img = await new Promise((res, rej)=>{ const i = new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
    const m = Math.min(img.naturalWidth, img.naturalHeight);
    const c = document.createElement('canvas'); c.width = c.height = lado;
    c.getContext('2d').drawImage(img, (img.naturalWidth-m)/2, (img.naturalHeight-m)/2, m, m, 0, 0, lado, lado);
    return await new Promise(r=>c.toBlob(r, 'image/jpeg', 0.88));
  } finally { URL.revokeObjectURL(url); }
}
async function enviarCard(){
  if(!CARD.blob) return;
  const file = new File([CARD.blob], (CARD.tipo==='mes'?'meus-treinos-mes':'meus-treinos-semana')+'.png', {type:'image/png'});
  try{
    if(navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file]}); return; }
  }catch(e){ if(e && e.name==='AbortError') return; }
  const dl = $('#share-dl'); if(dl) dl.click();
  toast('Imagem baixada. É só postar a partir da galeria.');
}

/* ---------- Eventos ---------- */
document.addEventListener('click', async e=>{
  if(e.target.id==='sheet'){ closeSheet(); return; }
  const t = e.target.closest('[data-a]'); if(!t || t.disabled) return;
  const a = t.dataset.a;
  switch(a){
    case 'go': go(t.dataset.v); break;
    case 'go-close': closeSheet(true); go(t.dataset.v); break;
    case 'evo': S.evoTab = t.dataset.t; if(S.view!=='evolucao') go('evolucao'); else render(); break;
    case 'start': startWorkout(t.dataset.l); break;
    case 'force-start': S.draft=null; LS.set(kDraft(), null); stopRest(); closeSheet(true); startWorkout(t.dataset.l); break;
    case 'check': toggleSet(+t.dataset.ei, +t.dataset.si); break;
    case 'addset': addSet(+t.dataset.ei); break;
    case 'swap': if(S.draft) swapSheet(+t.dataset.ei); break;
    case 'swap-go': { const v = $('#swap-n'); if(S.draft) swapEx(+t.dataset.ei, v ? v.value : ''); break; }
    case 'swap-undo': if(S.draft) undoSwap(+t.dataset.ei); break;
    case 'grupo': closeSheet(true); grupoSheet(); break;
    case 'g-convite': convidarGrupo(); break;
    case 'g-criar': { const n = ($('#g-nome').value||'').trim() || 'Família'; t.disabled = true;
      try{ S.grupo = await D.criarGrupo(n); S.grupoM = null; await carregarGrupo(); grupoSheet(); toast('Grupo criado! Mande o código para a família.'); }
      catch(err){ t.disabled = false; toast(erroGrupo(err), true); } break; }
    case 'g-entrar': { const c = ($('#g-cod').value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
      if(c.length!==6){ toast('O código tem 6 letras e números.', true); break; } t.disabled = true;
      try{ await D.entrarGrupo(c); await carregarGrupo(); closeSheet(true); go('hoje'); toast('Você entrou no grupo '+(S.grupo?S.grupo.nome:'')+'.'); }
      catch(err){ t.disabled = false; toast(erroGrupo(err), true); } break; }
    case 'g-sair': if(S.confirmDel!=='g-sair'){ S.confirmDel='g-sair'; t.textContent='Toque de novo para sair'; break; }
      try{ await D.sairGrupo(S.grupo.id); S.grupo = null; S.grupoM = null; LS.set(kGrupo(), null); closeSheet(true); render(); toast('Você saiu do grupo.'); }
      catch(err){ toast(erroGrupo(err), true); } break;
    case 'lembretes': closeSheet(true); if(FICHA) lembretesSheet(); break;
    case 'lem-go': baixarLembretes(); break;
    case 'videos': closeSheet(true); if(EDITOR) videosSheet(); break;
    case 'v-save': salvarVideosSheet(t); break;
    case 'rest-add': if(S.rest){ unlockAudio(); S.rest.end = Math.max(Date.now()+1000, (S.rest.over?Date.now():S.rest.end) + (+t.dataset.s)*1000); if(S.rest.over){ S.rest.over=false; $('#rest').classList.remove('over'); } S.rest.total = Math.max(S.rest.total, (S.rest.end-Date.now())/1000); scheduleBeeps((S.rest.end-Date.now())/1000); tickRest(); } break;
    case 'rest-skip': stopRest(); break;
    case 'sound': S.sound=!S.sound; LS.set('mt.sound',S.sound); if(S.sound) unlockAudio(); else cancelBeeps(); if(S.sound && S.rest && !S.rest.over) scheduleBeeps((S.rest.end-Date.now())/1000);
      t.classList.toggle('off', !S.sound); t.innerHTML = S.sound?ICON.sound:ICON.mute; t.setAttribute('aria-label', (S.sound?'Desligar':'Ligar')+' som do descanso'); break;
    case 'finish': finishPrompt(); break;
    case 'save': saveSession(); break;
    case 'discard': discardPrompt(); break;
    case 'discard-yes': discard(); break;
    case 'close': S.mreview=null; closeSheet(); break;
    case 'hist': histDetail(t.dataset.id); break;
    case 'hdel': if(S.confirmDel===t.dataset.id) deleteSession(t.dataset.id); else { S.confirmDel=t.dataset.id; t.textContent='Toque de novo para excluir'; } break;
    case 'copy': {
      const s = S.sessions.find(x=>x.id===t.dataset.id); if(!s) break;
      try{ await navigator.clipboard.writeText(summaryText(s)); toast('Resumo copiado.'); }catch(err){ toast('Não consegui copiar neste aparelho.', true); }
      break; }
    case 'bsave': saveBody(); break;
    case 'bdel': { const d = t.dataset.d; try{ await D.apagarPeso(d); S.body = S.body.filter(x=>x.d!==d); render(); }catch(err){ toast('Não consegui apagar agora.', true); } break; }
    case 'aval': { const f=$('#f-aval'); f.value=''; f.click(); break; }
    case 'mmanual': openManual(); break;
    case 'msave': saveReview(); break;
    case 'msel': S.mSel = t.dataset.k; render(); { const s=$('#msel'); if(s) s.scrollIntoView({block:'center', behavior:'smooth'}); } break;
    case 'mview': measureDetail(t.dataset.id); break;
    case 'mdel':
      if(S.confirmDel===t.dataset.id){ const id=t.dataset.id; try{ await D.apagarAvaliacao(id); S.measures = S.measures.filter(x=>x.id!==id); closeSheet(true); render(); toast('Avaliação excluída.'); }catch(err){ toast('Não consegui excluir agora.', true); } }
      else { S.confirmDel=t.dataset.id; t.textContent='Toque de novo para excluir'; }
      break;
    case 'pnew': S.pnew = {d:dayKey(Date.now()), files:{}}; openPhotoSheet(); break;
    case 'pslot': { S.pslot = t.dataset.p; const f=$('#f-photo'); f.value=''; f.click(); break; }
    case 'psave': savePhotos(); break;
    case 'pcancel': clearPnew(); closeSheet(); break;
    case 'pview': photoView(t.dataset.id); break;
    case 'pdel': if(S.confirmDel===t.dataset.id) deletePhoto(t.dataset.id); else { S.confirmDel=t.dataset.id; t.textContent='Toque de novo para excluir'; } break;
    case 'cpose': S.cmp.pose = t.dataset.p; render(); break;
    // login
    case 'auth-tab': S.auth = t.dataset.t; S.authErr=''; S.authMsg=''; render(); break;
    case 'sair': closeSheet(true); await D.sb.auth.signOut(); break;
    case 'recarregar': S.loadErr=''; render(); carregar(); break;
    // conta e fichas
    case 'perfil': perfilSheet(); break;
    case 'share': { const ss = t.dataset.id ? S.sessions.find(x=>x.id===t.dataset.id) : null;
      const cq = ss ? minhasConquistas().filter(c=>c.at===ss.start).pop() : null;
      abrirCompartilhar(t.dataset.t, ss, null, cq ? cq.nome : null); break; }
    case 'share-tab': abrirCompartilhar(t.dataset.t, CARD.ref, CARD.titulo, CARD.conquista); break;
    case 'share-go': enviarCard(); break;
    case 'p-save': {
      const n = $('#p-nome').value.trim(); const ig = $('#p-insta').value.trim().replace(/^@+/, '').replace(/\s+/g,'');
      if(!n){ toast('Digite seu nome.', true); break; }
      if(ig && !/^[A-Za-z0-9._]{1,30}$/.test(ig)){ toast('O @ do Instagram só aceita letras, números, ponto e _.', true); break; }
      try{ await D.salvarPerfil(UID, {nome:n, instagram: ig || null}); NOME = n; INSTA = ig; closeSheet(true); render(); toast('Perfil salvo.'); }catch(err){ toast('Não consegui salvar agora.', true); }
      break; }
    case 'p-foto': { const f=$('#f-avatar'); f.value=''; f.click(); break; }
    case 'fichas': if(FICHA) fichasSheet(); break;
    case 'f-usar': { const id = t.dataset.id; if(S.draft){ toast('Finalize ou descarte o treino em andamento antes de trocar de ficha.', true); break; }
      try{ await D.ativarFicha(UID, id); FICHAS = FICHAS.map(f=>Object.assign({}, f, {ativa:f.id===id})); definirFicha(); closeSheet(true); go('treinos'); toast('Agora você está usando "'+FICHA.nome+'".'); }catch(err){ toast('Não consegui trocar agora.', true); } break; }
    case 'f-apagar': { const id = t.dataset.id;
      if(S.confirmDel!==id){ S.confirmDel=id; t.textContent='Apagar?'; t.classList.add('wide'); break; }
      try{ await D.apagarFicha(id); FICHAS = FICHAS.filter(f=>f.id!==id); definirFicha(); fichasSheet(); toast('Ficha apagada. Os treinos feitos com ela continuam no histórico.'); }catch(err){ toast('Não consegui apagar agora.', true); } break; }
    case 'f-edit':
      closeSheet(true);
      if(S.draft){ toast('Finalize ou descarte o treino em andamento antes de editar a ficha.', true); break; }
      abrirEditor(fichaAtualEditavel(), 'treinos'); break;
    case 'ob-modelo': abrirEditor({nome:FICHA_MODELO.nome, order:FICHA_MODELO.order.slice(), w:copia(FICHA_MODELO.w), sched:Object.assign({}, FICHA_MODELO.sched), aviso:'Esta é a ficha modelo. Ajuste o que quiser e salve.'}, 'onboarding'); break;
    case 'ob-zero': abrirEditor({nome:'Minha ficha', order:['A'], w:{A:{name:'Treino A', focus:'', rest:'', ex:[{n:'', s:3, r:[10,12], rest:60, inc:2, tip:''}]}}, sched:cronogramaPadrao(['A'])}, 'onboarding'); break;
    case 'ob-foto': { const f=$('#f-ficha'); f.value=''; f.click(); break; }
    // editor
    case 'f-cancel': S.edit = null; go(FICHA ? (S.editBack==='onboarding' ? 'treinos' : S.editBack) : 'onboarding'); break;
    case 'f-save': salvarEdicao(); break;
    case 'fx-add': { const L=t.dataset.l; S.edit.w[L].ex.push({n:'', parts:null, s:3, r:[10,12], rest:60, inc:2, tip:''}); render(); const c=$('#fw-'+L); if(c) c.querySelectorAll('.fx')[S.edit.w[L].ex.length-1]?.scrollIntoView({block:'center'}); break; }
    case 'fx-del': { const L=t.dataset.l, i=+t.dataset.i; S.edit.w[L].ex.splice(i,1); render(); break; }
    case 'fx-up': case 'fx-down': { const L=t.dataset.l, i=+t.dataset.i, j = a==='fx-up'? i-1 : i+1; const ex=S.edit.w[L].ex; if(j<0||j>=ex.length) break; [ex[i],ex[j]]=[ex[j],ex[i]]; render(); break; }
    case 'fx-bi': { const L=t.dataset.l, i=+t.dataset.i, e=S.edit.w[L].ex[i];
      if(t.checked){ e.parts = [e.n||'', '']; e.inc = [Number(e.inc)||2, Number(e.inc)||2]; }
      else { e.n = (e.parts||[]).filter(Boolean).join(' + ') || e.n || ''; e.inc = Array.isArray(e.inc)? (e.inc[0]||0) : e.inc; e.parts = null; }
      render(); break; }
    case 'fw-add': { const L = LETRAS.find(x=>S.edit.order.indexOf(x)<0); if(!L) break; S.edit.order.push(L); S.edit.w[L] = {name:'Treino '+L, focus:'', rest:'', ex:[{n:'', parts:null, s:3, r:[10,12], rest:60, inc:2, tip:''}]}; render(); $('#fw-'+L)?.scrollIntoView({block:'start'}); break; }
    case 'fw-del': { const L=t.dataset.l; if(S.confirmDel!=='fw-'+L){ S.confirmDel='fw-'+L; t.textContent='Toque de novo para remover'; break; }
      S.confirmDel=null; S.edit.order = S.edit.order.filter(x=>x!==L); delete S.edit.w[L];
      Object.keys(S.edit.sched).forEach(d=>{ if(S.edit.sched[d]===L) S.edit.sched[d]='total'; }); render(); break; }
  }
});
document.addEventListener('input', e=>{
  const el = e.target;
  if(el.id==='cmp-range'){ const v=+el.value; const a=$('#cmp-img-a'), d=$('#cmp-div'); if(a) a.style.clipPath='inset(0 '+(100-v)+'% 0 0)'; if(d) d.style.left=v+'%'; return; }
  if(el.dataset && el.dataset.e && S.edit && el.tagName!=='SELECT'){ editInput(el); return; }
  const f = el.dataset && el.dataset.f; if(!f || !S.draft) return;
  if(f==='notes'){ S.draft.notes = el.value; touchDraft(); return; }
  const i=+el.dataset.ei, si=+el.dataset.si, pi=+el.dataset.pi;
  const st = S.draft.ex[i] && S.draft.ex[i].sets[si]; if(!st) return;
  st.p[pi][f] = el.value.replace(',','.');
  touchDraft();
});
document.addEventListener('change', e=>{
  const el = e.target, id = el.id;
  if(el.tagName==='SELECT' && el.dataset.e && S.edit){ setPath(S.edit, el.dataset.e, el.value); return; }
  if(id==='exsel'){ S.exSel = el.value; render(); }
  else if(id==='msel'){ S.mSel = el.value; render(); }
  else if(id==='cmp-a'){ S.cmp.a = el.value; render(); }
  else if(id==='cmp-b'){ S.cmp.b = el.value; render(); }
  else if(id==='pdate' && S.pnew){ S.pnew.d = el.value || dayKey(Date.now()); }
  else if(id==='f-aval'){ const fs = Array.from(el.files||[]); if(fs.length) readAvaliacao(fs); }
  else if(id==='f-avatar'){ const f = el.files && el.files[0]; if(f) trocarAvatar(f); }
  else if(id==='f-ficha'){ const fs = Array.from(el.files||[]); if(fs.length) readFicha(fs); }
  else if(id==='f-photo'){
    const f = el.files && el.files[0];
    if(f && S.pnew && S.pslot){ const old = S.pnew.files[S.pslot]; if(old) try{ URL.revokeObjectURL(old.url); }catch(x){}
      S.pnew.files[S.pslot] = {file:f, url:URL.createObjectURL(f)}; openPhotoSheet(); }
  }
});
document.addEventListener('submit', e=>{
  e.preventDefault();
  if(e.target.id==='bform') saveBody();
  else if(e.target.id==='f-auth') enviarAuth();
  else if(e.target.id==='f-nova') salvarNovaSenha();
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && !$('#sheet').hidden) closeSheet(); });
document.addEventListener('visibilitychange', ()=>{ if(document.hidden){ guardarCache(); return; } if(!document.hidden){ tickRest(); tickClock(); if(S.draft && S.view==='sessao') pedirTelaAcesa(); } });
window.addEventListener('online', ()=>{ if(!UID) return; if(S.offline) carregar(true); else { enviarPendentes(); carregarGrupo(); } });
window.addEventListener('offline', ()=>{ if(UID){ S.sync = 'offline'; renderStatus(); } });

/* ---------- Início ---------- */
function comPrazo(p, ms){ return Promise.race([p, new Promise((_, rej)=>setTimeout(()=>rej(new Error('tempo')), ms))]); }
async function carregar(silencioso){
  if(!silencioso){ S.view = 'carregando'; render(); }
  let d, doAparelho = false;
  try{
    d = await comPrazo(D.carregarTudo(UID), 15000);
    LS.set(kDados(), d);
  }catch(e){
    d = LS.get(kDados(), null); doAparelho = true;
    if(!d){
      if(!silencioso){ S.loadErr = 'Confira a internet e tente de novo.'; S.view = 'carregando'; render(); }
      return;
    }
  }
  S.offline = doAparelho;
  try{
    NOME = d.nome || NOME; AVATAR = d.avatar; INSTA = d.instagram; AVATAR_IMG = null;
    FICHAS = d.fichas; definirFicha();
    VIDEOS = {}; (d.videos||[]).forEach(v=>{ VIDEOS[v.chave] = {nome:v.nome, video:v.video}; }); EDITOR = !!d.editor;
    S.pending = LS.get(kPending(), []);
    const ids = new Set(d.treinos.map(s=>s.id));
    S.pending = S.pending.filter(p=>!ids.has(p.id)); LS.set(kPending(), S.pending);
    S.sessions = d.treinos.concat(S.pending).sort((a,b)=>b.start-a.start);
    S.body = d.peso; S.measures = d.avaliacoes; S.photos = d.fotos;
    const local = S.draft || LS.get(kDraft(), null);
    const nuvem = d.rascunho;
    S.draft = (local && (!nuvem || (local.at||0) >= (nuvem.at||0))) ? local : nuvem;
    if(S.draft && (!S.draft.w || !S.draft.ex)) S.draft = null;
    if(!silencioso || S.view==='carregando') S.view = !FICHA ? 'onboarding' : (S.draft && Date.now()-S.draft.start < 4*3600*1000 ? 'sessao' : 'hoje');
    if(doAparelho){ S.sync = 'offline'; }
    if(!silencioso || S.view!=='sessao') render(); else renderStatus();
    if(doAparelho){ if(!silencioso) toast('Sem internet: usando os dados guardados no aparelho. O treino é salvo quando a conexão voltar.'); }
    else { S.sync = 'ok'; enviarPendentes(); }
    carregarGrupo();
  }catch(e){
    S.loadErr = 'Não consegui abrir seus dados. Tente de novo.';
    S.view = 'carregando'; render();
  }
}
// Mantém a cópia do aparelho em dia (para abrir sem internet)
function guardarCache(){
  if(!UID) return;
  const c = LS.get(kDados(), null); if(!c) return;
  const pend = new Set(S.pending.map(p=>p.id));
  Object.assign(c, { treinos:S.sessions.filter(x=>!pend.has(x.id)), peso:S.body, avaliacoes:S.measures, fotos:S.photos, fichas:FICHAS, nome:NOME, avatar:AVATAR, instagram:INSTA,
    videos:Object.entries(VIDEOS).map(([chave,v])=>({chave, nome:v.nome, video:v.video})) });
  LS.set(kDados(), c);
}
// Usuário guardado no aparelho (para abrir sem internet)
function usuarioGuardado(){
  try{
    const ref = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0];
    const v = JSON.parse(localStorage.getItem('sb-'+ref+'-auth-token') || 'null');
    return v && v.user && v.user.id ? v.user : null;
  }catch(e){ return null; }
}
function entrar(user){
  if(UID === user.id) return;
  UID = user.id; EMAIL = user.email || '';
  NOME = (user.user_metadata && user.user_metadata.nome) || (EMAIL.split('@')[0] || '');
  carregar();
}
function sairLocal(){
  UID = null; EMAIL=''; NOME=''; AVATAR=''; INSTA=''; AVATAR_IMG=null; FICHAS=[]; FICHA=null; VIDEOS={}; EDITOR=false;
  Object.assign(S, {sessions:[], body:[], measures:[], photos:[], draft:null, pending:[], edit:null, exSel:null, mSel:null, grupo:null, grupoM:null, grupoErr:false, offline:false, sync:'ok'});
  stopRest(); closeSheet(true);
  S.auth='entrar'; S.authErr=''; S.authMsg='';
  S.view = 'auth'; render();
}
function iniciar(){
  if(!D.configurado){ S.view='auth'; render(); return; }
  D.sb.auth.onAuthStateChange((evento, sessao)=>{
    // não chamar o Supabase dentro deste callback (pode travar); adiar
    setTimeout(()=>{
      if(evento==='PASSWORD_RECOVERY'){ S.authErr=''; S.view='nova-senha'; render(); return; }
      if(evento==='SIGNED_OUT'){ sairLocal(); return; }
      if(sessao && sessao.user){ if(S.view!=='nova-senha') entrar(sessao.user); }
      else if(evento==='INITIAL_SESSION'){
        const u = !navigator.onLine ? usuarioGuardado() : null;
        if(u && LS.get('mt.dados.'+u.id, null)) entrar(u);
        else { S.view='auth'; render(); }
      }
    }, 0);
  });
}
render();
iniciar();

/* ---------- Funcionar offline (service worker) ---------- */
if(import.meta.env.PROD && 'serviceWorker' in navigator){
  window.addEventListener('load', async ()=>{
    try{
      await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      // guarda os arquivos desta versão do app e limpa os de versões antigas
      const atuais = performance.getEntriesByType('resource').map(r=>r.name)
        .filter(u=>{ try{ const x = new URL(u); return x.origin===location.origin && (/^\/assets\//.test(x.pathname) || /\.(png|webmanifest)$/.test(x.pathname)); }catch(e){ return false; } });
      const cache = await caches.open('mt-app');
      await Promise.all(atuais.map(u=>cache.match(u).then(m=>m || cache.add(u)).catch(()=>{})));
      const set = new Set(atuais);
      (await cache.keys()).forEach(req=>{ const p = new URL(req.url).pathname; if(/^\/assets\//.test(p) && !set.has(req.url)) cache.delete(req); });
    }catch(e){}
  });
}
