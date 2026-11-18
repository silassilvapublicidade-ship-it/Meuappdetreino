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
import { prepararCatalogo, acharNoCatalogo, GRUPOS } from './catalogo.js';
import { tecnicasDe, tecnica, TECNICAS } from './tecnicas.js';
import { sequencia, missoesDaSemana, TEMAS, aplicarTema, metaAgua, litros } from './engaja.js';
import { suportaPush, ehIOS, instalado as pwaInstalado, permissao, assinaturaAtual, assinar, cancelar as cancelarPush } from './push.js';
import * as D from './dados.js';
import { desenharSemana, desenharMes, desenharConquista, desenharAntesDepois, desenharRetrospectiva } from './cartao.js';

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
  shield:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.2-7.5 9.5-4.4-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M8.8 12.2l2.2 2.2 4.3-4.6"/></svg>',
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
let ADMIN = false;        // acesso à área do admin
let AVISOS = [];          // avisos do admin para todos
let METAS = { peso:null, gordura:null, data:null };
let NOTIF = { grupo:true, reacoes:true, lembrete:true, resumo:true }, LEM_HORA = '';
let MISSOES = [], TEMA = 'neon', AGUA = { dias:{}, manual:null };
const VERSAO = typeof __VERSAO__ !== 'undefined' ? __VERSAO__ : 'dev';
const S = {
  view:'carregando', auth:'entrar', authMsg:'', authErr:'',
  sessions:[], body:[], measures:[], photos:[], draft:null, pending:[],
  sync:'ok', rest:null, exSel:null, mSel:null, sound:LS.get('mt.sound', true), confirmDel:null,
  evoTab:'cargas', mreview:null, pnew:null, pslot:null, cmp:{pose:'frente', a:null, b:null}, busy:false,
  edit:null, editBack:'treinos', loadErr:'',
  grupo:null, grupoM:null, grupoErr:false, offline:false,
  admTab:'painel', adm:{}, admDono:null, reacoes:[], editS:null, cdTipo:null, vivo:null
};
/* ---------- Cardio ---------- */
const CARDIO_TIPOS = ['Esteira','Corrida na rua','Caminhada','Bicicleta','Elíptico','Escada','Remo','Air bike','Outro'];
// Aulas: gasto estimado por MET (equivalente metabólico) conforme a intensidade
const AULAS = {
  'Spinning': { ico:'🚴', met:{ leve:5.5, moderada:7, forte:8.5, 'muito forte':10.5 }, km:true },
  'Jump':     { ico:'🤸', met:{ leve:4.5, moderada:6, forte:7.5, 'muito forte':9 }, km:false },
  'Pump':     { ico:'🏋️', met:{ leve:3.5, moderada:5, forte:6, 'muito forte':7.5 }, km:false }
};
const INTENS = [['leve','Leve','dá para conversar'],['moderada','Moderada','fala frases curtas'],['forte','Forte','fala poucas palavras'],['muito forte','Muito forte','no limite']];
function ehCardio(s){ return !!s && s.letter==='CARDIO'; }
function ehAula(s){ return ehCardio(s) && !!AULAS[s.wname]; }
function letraCurta(s){ return ehAula(s) ? AULAS[s.wname].ico : ehCardio(s) ? '♥' : s.letter; }
function nomeSessao(s){ return ehAula(s) ? 'Aula de '+s.wname.toLowerCase() : ehCardio(s) ? 'Cardio ('+s.wname+')' : 'Treino '+s.letter; }
function kcalAula(tipo, intens, min){
  const a = AULAS[tipo], b = S.body[S.body.length-1];
  if(!a || !b || !min) return null;
  return Math.round(a.met[intens||'moderada'] * b.kg * min/60 / 5) * 5;
}
function dadosCardio(s){ const e = (s.ex||[])[0]; return (e && e.cardio) || {}; }
const kDados = ()=>'mt.dados.'+UID;
function metaSemana(){ return FICHA ? (SEMANA.filter(dd=>FICHA.W[FICHA.sched[dd]]).length || FICHA.order.length) : 3; }
function minhasConquistas(sessoes){
  return calcConquistas(sessoes || S.sessions, { meta: metaSemana(),
    avaliacoes: S.measures.map(m=>m.t || Date.parse(m.d+'T12:00')), fotos: S.photos.map(f=>Date.parse(f.d+'T12:00')) });
}
let CATALOGO = [];
const autoCache = new Map();
function videoAuto(nome){
  if(!nome || !CATALOGO.length) return null;
  if(!autoCache.has(nome)){ const r = acharNoCatalogo(nome); autoCache.set(nome, r ? { url:'https://www.youtube.com/watch?v='+r.item.youtube, titulo:r.item.titulo } : null); }
  return autoCache.get(nome);
}
// vídeo escolhido pelo admin > link antigo da ficha > o mais parecido da biblioteca
function videoDe(e){
  if(!e || !e.n) return '';
  const v = VIDEOS[chaveVideo(e.n)]; if(v && v.video) return v.video;
  if(e.video) return e.video;
  const a = videoAuto(e.n); return a ? a.url : '';
}
function chipsTecnica(e){
  return tecnicasDe(e).map(t=>`<button class="chip bi tq" data-a="tecnica" data-t="${t.id}" aria-label="Como fazer ${esc(t.nome)}">${esc(t.nome)} <span aria-hidden="true">ⓘ</span></button>`).join('');
}
function tecnicaSheet(id){
  const t = tecnica(id); if(!t) return;
  const outras = TECNICAS.filter(x=>x.id!==id).map(x=>`<button class="chip tq-o" data-a="tecnica" data-t="${x.id}">${esc(x.nome)}</button>`).join('');
  openSheet(`<p class="eyebrow">Como fazer</p><h2 style="margin-top:6px">${esc(t.nome)}</h2>
    <p class="tq-res">${esc(t.resumo)}</p>
    <ol class="tq-passos">${t.passos.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
    ${t.obs?`<p class="tip"><b>Atenção:</b> ${esc(t.obs)}</p>`:''}
    <div class="btns" style="margin-top:14px"><button class="btn primary" data-a="close">Entendi</button></div>
    <details class="tq-mais"><summary>Outras técnicas</summary><div class="chips">${outras}</div></details>`);
}
function videoLink(e){ const u = videoDe(e); return u ? `<a class="vlink" href="${esc(u)}" data-video="1" data-t="${esc(e.n)}" target="_blank" rel="noopener noreferrer">${ICON.play} Ver execução</a>` : ''; }
// Vídeo dentro do app (player do YouTube embutido); outros links abrem fora
function idYoutube(u){
  try{
    const x = new URL(u), h = x.hostname.replace(/^www\.|^m\./,'');
    let id = null;
    if(h==='youtu.be') id = x.pathname.slice(1);
    else if(/youtube(-nocookie)?\.com$/.test(h)) id = x.searchParams.get('v') || (x.pathname.match(/\/(embed|shorts|live)\/([^/?#]+)/)||[])[2];
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }catch(e){ return null; }
}
function abrirVideo(url, titulo, deBiblioteca){
  const id = idYoutube(url);
  if(!id){ window.open(url, '_blank', 'noopener'); return; }
  // Capa própria do app no lugar da miniatura do YouTube; o vídeo só carrega no toque.
  // mute=1 garante que ele já comece tocando (sem som o navegador não bloqueia) e a capa
  // do canal não aparece; loop evita a tela final com sugestões.
  const capa = `<button class="pl-capa" data-a="pl-play" data-id="${id}" data-t="${esc(titulo||'')}" aria-label="Tocar vídeo de execução">
      <span class="pl-bt">${ICON.play}</span>
      <span class="pl-tx">Toque para ver a execução</span>
    </button>`;
  openSheet(`<h2 class="pl-t">${esc(titulo||'Execução')}</h2>
    <div class="player">${navigator.onLine ? capa : '<p class="note">Sem internet: o vídeo abre quando a conexão voltar.</p>'}</div>
    <div class="btns" style="margin-top:12px">${deBiblioteca?'<button class="btn" data-a="biblioteca">Voltar à biblioteca</button>':''}<button class="btn ghost" data-a="close">Fechar</button></div>
    <p class="note" style="text-align:center"><a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer" class="link">Abrir no YouTube</a></p>`);
}
function tocarVideo(bt){
  const id = bt.dataset.id;
  if(!/^[A-Za-z0-9_-]{11}$/.test(id||'')) return;
  const src = 'https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&loop=1&playlist='+id;
  const box = bt.parentNode;
  box.innerHTML = `<iframe src="${src}" title="${esc(bt.dataset.t||'Vídeo de execução')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
}
document.addEventListener('click', e=>{
  const p = e.target.closest && e.target.closest('[data-a="pl-play"]');
  if(p){ e.preventDefault(); e.stopPropagation(); tocarVideo(p); return; }
  const a = e.target.closest && e.target.closest('a[data-video]');
  if(!a || !idYoutube(a.href)) return;
  e.preventDefault(); e.stopPropagation();
  abrirVideo(a.href, a.dataset.t, !!a.closest('#bib-res'));
}, true);

function definirFicha(){
  const ativa = FICHAS.find(f=>f.ativa) || FICHAS[FICHAS.length-1] || null;
  if(!ativa){ FICHA = null; return; }
  FICHA = Object.assign({ id:ativa.id, nome:ativa.nome, criada:ativa.criada||null }, prepararFicha(ativa));
}
function nomeDeChave(){
  const N = {};
  S.sessions.forEach(s=>(s.ex||[]).forEach(e=>(e.keys||[]).forEach((k,i)=>{ if(!N[k]) N[k] = (e.parts||[e.n])[i] || e.n; })));
  if(FICHA) FICHA.order.forEach(L=>FICHA.W[L].ex.forEach(e=>e.keys.forEach((k,i)=>{ N[k] = e.parts[i]; })));
  return N;
}

/* ---------- Regras de treino ---------- */
function sessionsDaFicha(){ return FICHA ? S.sessions.filter(s=>s.planId===FICHA.id) : []; }
// Próximo treino: primeiro o que ficou pendente na semana (dia previsto já passou ou é hoje),
// depois o que vem a seguir no cronograma; sem cronograma, segue a sequência A → B → C…
function feitosNaSemana(){
  const wk = startOfWeek(Date.now());
  return new Set(sessionsDaFicha().filter(s=>s.start>=wk && !ehCardio(s)).map(s=>s.letter));
}
function pendentesSemana(){
  if(!FICHA) return [];
  const feitos = feitosNaSemana(), hoje = (new Date().getDay()+6)%7, out = [];
  const wk = startOfWeek(Date.now()), desde = FICHA.criada ? chaveDia(FICHA.criada) : '';
  SEMANA.forEach((wd,i)=>{
    const L = FICHA.sched[wd];
    if(chaveDia(wk + i*864e5 + 12*3600e3) < desde) return; // a ficha ainda não existia nesse dia
    if(i<=hoje && FICHA.W[L] && !feitos.has(L) && !out.some(x=>x.L===L)) out.push({ L, wd, hoje: i===hoje });
  });
  return out;
}
function nextLetter(){
  if(!FICHA || !FICHA.order.length) return null;
  const temCrono = SEMANA.some(wd=>FICHA.W[FICHA.sched[wd]]);
  if(temCrono){
    const pend = pendentesSemana();
    if(pend.length) return pend[0].L;
    const feitos = feitosNaSemana(), hoje = (new Date().getDay()+6)%7;
    const prox = SEMANA.find((wd,i)=>i>hoje && FICHA.W[FICHA.sched[wd]] && !feitos.has(FICHA.sched[wd]));
    if(prox!=null) return FICHA.sched[prox];
  }
  const last = sessionsDaFicha().find(s=>!ehCardio(s));
  if(!last || FICHA.order.indexOf(last.letter)<0) return FICHA.order[0];
  return FICHA.order[(FICHA.order.indexOf(last.letter)+1)%FICHA.order.length];
}
// Quantas vezes cada treino da ficha foi feito e quando foi a última
function execucoes(L){
  const lista = sessionsDaFicha().filter(s=>s.letter===L);
  return { n: lista.length, ultima: lista.length ? lista[0].start : null };
}
function dataCompleta(ts){ return new Date(ts).toLocaleDateString('pt-BR'); }
function linhaExecucoes(L){
  const x = execucoes(L);
  return x.n ? `Executado <b>${x.n}</b> ${x.n===1?'vez':'vezes'}, última em <b>${dataCompleta(x.ultima)}</b>` : 'Ainda não executado nesta ficha';
}
// Escolher outro treino para hoje (ex.: academia lotada)
function trocarTreinoSheet(){
  if(!FICHA) return;
  const feitos = feitosNaSemana(), sug = nextLetter(), hoje = new Date().getDay();
  const diaDe = L => { const d = SEMANA.find(wd=>FICHA.sched[wd]===L); return d!=null ? DIAS[d] : null; };
  const itens = FICHA.order.map(L=>{
    const W = FICHA.W[L], feito = feitos.has(L), dia = diaDe(L);
    const status = feito ? '<span class="tt-st ok">✓ feito nesta semana</span>' : '<span class="tt-st">ainda não feito nesta semana</span>';
    return `<div class="tt${L===sug?' tt-sug':''}${feito?' feito':''}">
      <div class="tt-l neon" aria-hidden="true">${esc(L)}</div>
      <div class="tt-i"><b>${esc(W.name)}</b><small>${esc(W.ex.length+' exercícios'+(dia?' · '+dia+(FICHA.sched[hoje]===L?' (hoje)':''):''))}</small><small class="exec">${linhaExecucoes(L)}</small>${status}</div>
      <div class="tt-b"><button class="btn sm${L===sug?' primary':''}" data-a="start" data-l="${esc(L)}">${L===sug?'Começar (sugerido)':'Começar'}</button><button class="btn sm ghost" data-a="go-close" data-v="treino:${esc(L)}">Ver</button></div></div>`;
  }).join('');
  openSheet(`<h2>Escolher o treino de hoje</h2>
    <p>Academia lotada ou equipamento ocupado? Faça qualquer treino da ficha. O app guarda o que ficou para trás e sugere ele no próximo dia.</p>
    <div class="tt-list">${itens}</div>
    <div class="btns" style="margin-top:12px"><button class="btn ghost" data-a="close">Fechar</button></div>`);
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
  else if(v==='admin') html = ADMIN ? vAdmin() : vHoje();
  $('#app').innerHTML = html;
  const fora = ['carregando','auth','nova-senha','onboarding','ficha'].indexOf(v)>=0;
  document.body.classList.toggle('in-session', v==='sessao');
  document.body.classList.toggle('no-nav', fora);
  TABS.forEach(t=>{
    const b = $('#nav-'+t);
    const cur = v===t || (t==='treinos' && v.indexOf('treino:')===0);
    if(cur) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
  });
  if(v==='sessao' && S.draft) pedirTelaAcesa(); else soltarTela();
  if((v==='sessao'||v==='hoje') && S.grupo && vivoTimer && !S.vivo) atualizarVivo(true);
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
  const voltar = FICHA ? `<button class="back" data-a="go" data-v="treinos">${ICON.back} Voltar</button>` : `<header class="top"><span class="date">Olá, ${esc(NOME||'')} ${arroba(INSTA)}</span>${avatarBtn()}</header>`;
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
             : `<div class="frow2"><input class="inp" data-e="w.${L}.ex.${i}.n" list="cat-list" autocomplete="off" value="${esc(e.n)}" placeholder="Nome do exercício" aria-label="Nome do exercício"><label class="mini-f"><input class="inp sm" data-e="w.${L}.ex.${i}.inc" inputmode="decimal" value="${esc(fmtN(e.inc))}" aria-label="Aumento de carga em kg"><span>+kg</span></label></div>`}
        <div class="fgrid">
          <label><span>Séries</span><input class="inp sm" data-e="w.${L}.ex.${i}.s" inputmode="numeric" value="${e.s}"></label>
          <label><span>Reps mín.</span><input class="inp sm" data-e="w.${L}.ex.${i}.r.0" inputmode="numeric" value="${e.r[0]}"></label>
          <label><span>Reps máx.</span><input class="inp sm" data-e="w.${L}.ex.${i}.r.1" inputmode="numeric" value="${e.r[1]}"></label>
          <label><span>Descanso (s)</span><input class="inp sm" data-e="w.${L}.ex.${i}.rest" inputmode="numeric" value="${e.rest}"></label>
        </div>
        <textarea class="notes sm" data-e="w.${L}.ex.${i}.tip" placeholder="Dica de execução (opcional)" aria-label="Dica de execução">${esc(e.tip||'')}</textarea>
        ${EDITOR?`<label class="fld-at vid"><span>${ICON.play}</span><input class="inp sm" data-e="w.${L}.ex.${i}.video" type="url" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(e.video||'')}" placeholder="${esc(phVideo(bi ? e.parts.filter(Boolean).join(' + ') : e.n))}" aria-label="Link do vídeo de execução"></label>`:''}
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
      <div class="st"><b>${E.id?'Editar ficha':'Nova ficha'}${E.dono?' de '+esc(E.dono.nome):''}</b><small>${E.dono?'Você está editando como admin':'Confira tudo e salve no fim'}</small></div></div></div>
    ${E.aviso?`<p class="sug">${esc(E.aviso)}</p>`:''}
    <label class="lbl" for="f-nome">Nome da ficha</label>
    <input class="inp" id="f-nome" data-e="nome" value="${esc(E.nome||'')}">
    <section class="card" style="margin-top:14px"><h2 class="h2">Dias da semana</h2>${sched}
      <p class="note">Se faltar um dia, o app segue a sequência dos treinos.</p></section>
    ${treinos}
    ${E.order.length<7?`<button class="btn ghost" data-a="fw-add" style="margin-top:12px">+ Treino ${LETRAS.find(x=>E.order.indexOf(x)<0)}</button>`:''}
    <div class="btns" style="margin-top:18px"><button class="btn primary" data-a="f-save">Salvar ficha</button><button class="btn ghost" data-a="f-cancel">Cancelar</button></div>
    ${datalistCatalogo()}`;
}
function phVideo(nome){ const a = videoAuto(nome); return a ? 'Automático: '+a.titulo : 'Sem vídeo na biblioteca: cole um link (opcional)'; }
function datalistCatalogo(){ return `<datalist id="cat-list">${[...new Set(CATALOGO.filter(c=>c.modulo>=10).map(c=>c.titulo))].map(t=>`<option value="${esc(t)}"></option>`).join('')}</datalist>`; }
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
  const linhas = [...porChave.entries()].map(([k,n])=>({k, n, v: VIDEOS[k] ? VIDEOS[k].video : '', a: videoAuto(n)}))
    .sort((a,b)=> ((a.v||a.a)?1:0)-((b.v||b.a)?1:0) || a.n.localeCompare(b.n,'pt-BR'));
  const sem = linhas.filter(l=>!l.v && !l.a).length, auto = linhas.filter(l=>!l.v && l.a).length;
  openSheet(`<h2>Vídeos dos exercícios</h2>
    <p>Os links valem para todo mundo: quem tiver o exercício na ficha vê o botão <b>▶ Ver execução</b>. Só você pode mudar.</p>
    <p class="note" style="margin-top:0">${linhas.length} exercícios das fichas da família · ${auto} com vídeo automático da biblioteca · <b>${sem}</b> sem vídeo</p>
    <p class="note">Campo vazio = usa o vídeo automático. Cole um link para trocar.</p>
    <div class="vlist">${linhas.map(l=>`<label class="vrow${l.v?' tem':l.a?' auto':''}"><span>${esc(l.n)}</span>
      ${!l.v && l.a ? `<small class="vauto">Automático: <a href="${esc(l.a.url)}" target="_blank" rel="noopener">${esc(l.a.titulo)} ▶</a></small>` : ''}
      <input class="inp vin" type="url" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" data-vk="${esc(l.k)}" data-vn="${esc(l.n)}" value="${esc(l.v)}" placeholder="${l.a?'Trocar o automático: cole outro link':'Cole o link do vídeo'}"></label>`).join('')}</div>
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
  if(E.dono){
    try{
      await D.adminSalvarFicha(E.dono.id, E.id||null, E.nome, json);
      if(EDITOR) await sincronizarVideosDaFicha(E);
      if(E.dono.id===UID){ const d = await D.carregarTudo(UID); FICHAS = d.fichas; definirFicha(); }
      const nome = E.dono.nome; S.edit = null; S.adm.usuarios = null;
      go('admin'); toast('Ficha de '+nome+' salva. Ela vê na próxima vez que abrir o app.');
    }catch(e){ if(btn) btn.disabled = false; toast('Não consegui salvar a ficha. Confira a conexão e tente de novo.', true); }
    return;
  }
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
// Grupo muscular curto para caber embaixo da letra (ex.: "Peito / Tríceps / Metabólico" → "Peito Tríceps")
function rotuloCurto(W){
  const nome = String(W && W.name || '').replace(/\(.*?\)/g,'').trim();
  const partes = nome.split(/\s*[\/·,+&]\s*|\s+e\s+/i).map(x=>x.trim()).filter(Boolean);
  if(partes.length >= 2) return partes.slice(0,2).map(x=>x.split(/\s+/)[0]).join(' ');
  return nome.split(/\s+/).slice(0,2).join(' ');
}
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
    const pend = pendentesSemana(), atrasado = pend.length && pend[0].L===L && !pend[0].hoje;
    const trocouHoje = S.sessions.find(x=>sameDay(x.start, now) && x.planId===FICHA.id && !ehCardio(x) && x.letter!==L);
    const why = trocouHoje && pend.length && pend[0].L===L
      ? `Hoje você fez o Treino ${esc(trocouHoje.letter)} no lugar do ${esc(L)}. O ${esc(L)} fica guardado como o próximo.`
      : atrasado
      ? `O Treino ${esc(L)} de ${DIAS[pend[0].wd]} ficou pendente, então ele vem primeiro.${pend.length>1?' Depois: '+pend.slice(1).map(p=>p.L).join(', ')+'.':''}`
      : last
      ? `Último: Treino ${esc(last.letter)} em ${fmtDate(last.start)}. Se faltar um dia, siga a sequência ${seq}.`
      : `Primeiro registro: comece pelo ${FICHA.order[0]} e siga a sequência ${seq}.`;
    hero = `<section class="hero">
      <div class="eyebrow">Próximo treino</div>
      <div class="hero-row"><div class="big-letter neon" aria-hidden="true">${L}</div>
        <div><div class="hero-name">${esc(W.name)}</div><div class="hero-focus">${esc(W.focus)}</div>
        <div class="meta">${W.ex.length} exercícios · ${W.total} séries</div></div></div>
      <p class="why">${why}${ups?` <span class="upnote">▲ ${ups} ${ups>1?'exercícios prontos':'exercício pronto'} para subir carga.</span>`:''}</p>
      <div class="btns"><button class="btn primary" data-a="start" data-l="${L}">Começar treino ${L}</button>
      <button class="btn ghost" data-a="go" data-v="treino:${L}">Ver exercícios</button>
      ${FICHA.order.length>1?`<button class="btn ghost" data-a="trocar-treino">⇄ Fazer outro treino hoje</button>`:''}</div></section>`;
  }
  let today;
  if(todayDone.length) today = `Hoje você já fez: <b>${todayDone.map(s=>esc(nomeSessao(s))).join(' e ')}</b> · ${mins(todayDone.reduce((n,s)=>n+(s.dur||0),0))} min.`;
  else if(sched==='total') today = `Hoje (${DIAS[dow]}) é <b>descanso total</b>: recuperação muscular.`;
  else if(sched==='ativo') today = `Hoje (${DIAS[dow]}) é <b>descanso ativo</b>: recuperação, sono e hidratação.`;
  else {
    today = `Cronograma de hoje (${DIAS[dow]}): <b>Treino ${sched}</b>.`;
    if(!d && sched!==nextLetter()) today += ` O app sugere o ${nextLetter()} (pendente).`;
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
    const treino = !isRest && FICHA.W[plan];
    const grupo = treino ? rotuloCurto(treino) : '';
    const sub = done.length ? done.map(s=>esc(letraCurta(s))).join('+') : (isRest ? 'folga' : esc(grupo));
    const rot = `${DIAS[wd]}${done.length?': '+done.map(s=>nomeSessao(s)).join(' e ')+' feito':treino?': Treino '+plan+', '+treino.name:isRest?': folga':''}`;
    const cls = `day${done.length?' done':''}${isRest&&!done.length?' rest':''}${isToday?' today':''}${treino?' tap':''}`;
    const inner = `<span class="d">${WD[wd]}</span><span class="g">${g}</span><span class="s">${sub}</span>`;
    return treino ? `<button class="${cls}" data-a="go" data-v="treino:${esc(plan)}" aria-label="${esc(rot)}. Abrir treino.">${inner}</button>` : `<div class="${cls}" aria-label="${esc(rot)}">${inner}</div>`;
  }).join('');
  const lastBody = S.body[S.body.length-1];
  const lastAny = S.sessions[0];
  const tiles = `<div class="tiles">
    <div class="tile"><div class="k">Semana</div><div class="v">${weekSessions.length}<small> de ${meta}</small></div></div>
    <div class="tile"><div class="k">Último</div><div class="v">${lastAny ? agoTxt(lastAny.start) : '—'}</div></div>
    <button class="tile" data-a="evo" data-t="corpo" style="text-align:left;color:inherit;font:inherit"><span class="k">Peso</span><span class="v">${lastBody ? fmtN(lastBody.kg)+'<small> kg</small>' : '<small>registrar</small>'}</span></button>
  </div>`;
  let date = new Date().toLocaleDateString('pt-BR',{weekday:'long', day:'numeric', month:'long'}); date = date.charAt(0).toUpperCase()+date.slice(1);
  return `<header class="top"><span class="date">${esc(date)}<small class="ola">Olá, ${esc((NOME||'').split(' ')[0])}${INSTA?' · '+arroba(INSTA):''}</small></span><span class="top-r">${chipSeq()}${statusPill()}${avatarBtn()}</span></header>
    ${avisosHoje()}
    ${cardRetro()}
    ${cardInstalar()}
    ${cardNotif()}
    ${cardFichaVencendo()}
    ${hero}
    <p class="todayline">${today}</p>${linhaSeqHoje()}
    <button class="btn sm ghost cd-btn" data-a="cardio">♥ Registrar cardio</button>
    <div class="section"><div class="card-h"><h2 class="h2">Esta semana</h2><button class="link" data-a="share" data-t="semana">${ICON.share} Compartilhar</button></div><div class="week">${cells}</div></div>
    ${cardAgua()}
    ${cardMissoes()}
    <div class="section">${nivelStrip()}</div>
    <div class="section">${tiles}</div>
    ${grupoCard()}`;
}
function nivelStrip(){
  const nv = nivel(pontos());
  const sem = semanasAtivas(S.sessions.map(s=>chaveDia(s.start)));
  const nc = minhasConquistas().filter(c=>c.at).length;
  return `<button class="lvl" data-a="evo" data-t="conquistas" aria-label="Nível ${esc(nv.nome)}, ${sem} semanas ativas, ${nc} conquistas. Ver conquistas.">
    <span class="lvl-fire${sem?'':' off'}"><span aria-hidden="true">💪</span><b>${sem}</b><small>${sem===1?'semana ativa':'semanas ativas'}</small></span>
    <span class="lvl-main"><span class="lvl-top"><b>Nível ${esc(nv.nome)}</b><small>${nv.prox ? 'faltam '+(nv.prox.n-nv.n)+' pontos para '+esc(nv.prox.nome) : 'nível máximo'}</small></span>
    <span class="bar"><i style="width:${Math.round(nv.pct*100)}%"></i></span>
    <small class="lvl-c">🏅 ${nc} ${nc===1?'conquista':'conquistas'} · ver todas ›</small></span></button>`;
}

/* ========== Engajamento: sequência, missões, recordes, água e temas ========== */
function pontos(){ return S.sessions.length + MISSOES.length; }
function diasTreinados(){ return S.sessions.map(s=>chaveDia(s.start)); }
function minhaSequencia(){ return sequencia({ dias: diasTreinados(), sched: FICHA ? FICHA.sched : null }); }
const reduzMov = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Confete leve em canvas, com as cores do tema
function confete(forca){
  if(reduzMov()) return;
  const cv = document.createElement('canvas'); cv.className = 'confete'; document.body.appendChild(cv);
  const W = cv.width = innerWidth*devicePixelRatio, H = cv.height = innerHeight*devicePixelRatio, ctx = cv.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const cores = [css.getPropertyValue('--mint'), css.getPropertyValue('--cyan'), '#ffffff', '#ffd166'].map(c=>c.trim()||'#fff');
  const N = Math.round(90*(forca||1));
  const P = Array.from({length:N}, ()=>({ x: W*(0.2+Math.random()*0.6), y: H*0.35, vx:(Math.random()-0.5)*W*0.018, vy:-(Math.random()*H*0.022+H*0.008),
    r: (4+Math.random()*6)*devicePixelRatio, c: cores[Math.floor(Math.random()*cores.length)], a: Math.random()*6, va:(Math.random()-0.5)*0.3 }));
  const t0 = performance.now();
  (function quadro(t){
    const dt = t - t0; ctx.clearRect(0,0,W,H);
    P.forEach(p=>{ p.vy += H*0.0009; p.x += p.vx; p.y += p.vy; p.a += p.va;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a); ctx.globalAlpha = Math.max(0, 1 - dt/1900); ctx.fillStyle = p.c; ctx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2); ctx.restore(); });
    if(dt < 1900) requestAnimationFrame(quadro); else cv.remove();
  })(t0);
}
function vibrar(p){ try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} }
function somFesta(){
  if(!S.sound || !AC) return;
  try{ const t0 = AC.currentTime+0.02;
    [[0,660],[0.09,880],[0.18,1100],[0.3,1320]].forEach(([o,f])=>{ const osc=AC.createOscillator(), g=AC.createGain(); osc.type='triangle'; osc.frequency.value=f;
      g.gain.setValueAtTime(0.0001,t0+o); g.gain.exponentialRampToValueAtTime(0.25,t0+o+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t0+o+0.22);
      osc.connect(g); g.connect(AC.destination); osc.start(t0+o); osc.stop(t0+o+0.25); });
  }catch(e){}
}
// Faixa de comemoração que aparece por cima da tela
function festa(ico, titulo, texto){
  const old = document.querySelector('.festa'); if(old) old.remove();
  const el = document.createElement('div'); el.className = 'festa'; el.setAttribute('role','status');
  el.innerHTML = `<span class="festa-i" aria-hidden="true">${ico}</span><span><b>${esc(titulo)}</b><small>${esc(texto)}</small></span>`;
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('on'));
  setTimeout(()=>{ el.classList.remove('on'); setTimeout(()=>el.remove(), 400); }, 3800);
}

/* ----- 1. Recorde na hora da série ----- */
// Melhor carga e, para cada carga, o máximo de repetições já feitas antes deste treino.
function historicoEx(k, antes){
  let kg = null; const reps = {};
  S.sessions.forEach(s=>{ if(s.start>=antes) return; (s.ex||[]).forEach(e=>(e.keys||[]).forEach((kk,i)=>{ if(kk!==k) return;
    e.sets.forEach(st=>{ const p = st.p[i]||{}, w = num(p.kg), r = num(p.r); if(!w) return; if(kg==null||w>kg) kg = w; if(r && (!reps[w]||r>reps[w])) reps[w] = r; }); })); });
  return { kg, reps };
}
function checarRecorde(i, si){
  const d = S.draft; if(!d) return;
  const e = d.w.ex[i], st = d.ex[i].sets[si];
  (e.keys||[]).forEach((k,pi)=>{
    const w = num(st.p[pi]&&st.p[pi].kg), r = num(st.p[pi]&&st.p[pi].r);
    if(!w) return;
    const h = historicoEx(k, d.start); if(h.kg==null) return; // sem histórico: primeira vez não é recorde
    // o que já foi feito neste treino antes desta série
    let kgHoje = null, repsHoje = 0;
    d.ex[i].sets.forEach((x,xi)=>{ if(xi===si || !x.done) return; const pw = num(x.p[pi]&&x.p[pi].kg), pr = num(x.p[pi]&&x.p[pi].r); if(pw && (kgHoje==null||pw>kgHoje)) kgHoje = pw; if(pw===w && pr>repsHoje) repsHoje = pr; });
    const nome = e.parts.length>1 ? e.parts[pi] : e.n;
    const topo = Math.max(h.kg, kgHoje||0);
    if(w > topo){
      d.prs = (d.prs||[]).concat([{ n:nome, kg:w, antes:h.kg }]);
      festa('🏆', 'Novo recorde!', `${nome}: ${fmtN(w)} kg (antes ${fmtN(h.kg)} kg)`);
      confete(1); vibrar([40,40,120]); somFesta(); touchDraft();
    } else if(r && w===h.kg && (kgHoje==null || kgHoje<w) && h.reps[w] && r > h.reps[w]){
      d.prs = (d.prs||[]).concat([{ n:nome, kg:w, r, antesR:h.reps[w] }]);
      festa('💥', 'Recorde de repetições!', `${nome}: ${r} reps com ${fmtN(w)} kg (antes ${h.reps[w]})`);
      confete(0.6); vibrar([40,40,80]); somFesta(); touchDraft();
    }
  });
}

/* ----- 2. Tela de fim de treino ----- */
function topSet(e){ let b = null; e.sets.forEach(st=>{ const p = st.p[0]||{}; const kg = num(p.kg)||0, r = num(p.r)||0; if(!b || kg>b.kg || (kg===b.kg && r>b.r)) b = {kg, r}; }); return b; }
function resumoTreinoSheet(s, prs, extra, selo){
  const ant = S.sessions.find(x=>x.id!==s.id && x.letter===s.letter && x.start<s.start && !ehCardio(x));
  const dv = ant && ant.vol ? Math.round((s.vol-ant.vol)/ant.vol*100) : null;
  const dm = ant ? mins(s.dur) - mins(ant.dur) : null;
  const seq = minhaSequencia();
  const linhas = s.ex.map(e=>{
    const t = topSet(e); if(!t) return '';
    const antE = ant && (ant.ex||[]).find(x=>x.key===e.key);
    const tA = antE ? topSet(antE) : null;
    const delta = tA && t.kg && tA.kg ? t.kg - tA.kg : null;
    const tag = delta==null ? '<span class="rs-d nv">novo</span>' : delta>0 ? `<span class="rs-d up">▲ ${fmtN(delta)} kg</span>` : delta<0 ? `<span class="rs-d dn">▼ ${fmtN(-delta)} kg</span>` : (t.r>tA.r ? `<span class="rs-d up">▲ ${t.r-tA.r} rep</span>` : '<span class="rs-d eq">=</span>');
    return `<li><span class="rs-n">${esc(e.n)}</span><span class="rs-v">${t.kg?fmtN(t.kg)+' kg × ':''}${t.r||'–'}</span>${tag}</li>`;
  }).join('');
  const recs = (prs||[]).map(p=>`<li>${esc(p)}</li>`).join('');
  const missoes = missoesAtuais();
  const mOk = missoes.filter(m=>m.ok).length;
  openSheet(`<div class="rs-top"><span class="rs-ico" aria-hidden="true">${prs && prs.length ? '🏆' : '💪'}</span>
      <h2>Treino ${esc(s.letter)} concluído!</h2><p>${esc(s.wname||'')}</p></div>
    <div class="sum"><div class="tile"><div class="k">Tempo</div><div class="v">${mins(s.dur)}<small> min</small></div>${dm!=null&&dm!==0?`<div class="dlt">${dm>0?'+':''}${dm} min</div>`:''}</div>
      <div class="tile"><div class="k">Séries</div><div class="v">${s.done}<small>/${s.total}</small></div></div>
      <div class="tile"><div class="k">Volume</div><div class="v">${fmtInt(s.vol)}<small> kg</small></div>${dv!=null?`<div class="dlt ${dv>=0?'up':'dn'}">${dv>=0?'▲':'▼'} ${Math.abs(dv)}%</div>`:''}</div></div>
    ${ant?`<p class="note" style="margin:6px 0 0">Comparado com o Treino ${esc(s.letter)} de ${fmtDate(ant.start)}.</p>`:''}
    ${recs?`<ul class="prs rs-prs">${recs}</ul>`:''}
    <div class="rs-strip"><button class="rs-b" data-a="seq"><span aria-hidden="true">🔥</span><b>${seq.n}</b><small>${seq.n===1?'dia seguido':'dias seguidos'}</small></button>
      <button class="rs-b" data-a="missoes"><span aria-hidden="true">🎯</span><b>${mOk}/${missoes.length}</b><small>missões</small></button>
      <button class="rs-b" data-a="evo" data-t="conquistas"><span aria-hidden="true">⭐</span><b>${esc(nivel(pontos()).nome)}</b><small>nível</small></button></div>
    ${extra?`<p class="rs-extra">${esc(extra.trim())}</p>`:''}
    ${linhas?`<p class="lbl" style="margin-top:16px">Melhor série de cada exercício</p><ul class="rs-ex">${linhas}</ul>`:''}
    <div class="btns" style="margin-top:16px"><button class="btn primary" data-a="rs-share">${ICON.share} Compartilhar card</button><button class="btn ghost" data-a="close">Fechar</button></div>`);
  S.rsCard = { s, titulo: 'Treino '+s.letter+' salvo!'+extra, selo };
  if(prs && prs.length || selo){ confete(prs && prs.length ? 1.3 : 1); vibrar([60,50,60]); somFesta(); }
}

/* ----- 3. Sequência com chama ----- */
function chipSeq(){
  if(!FICHA) return '';
  const q = minhaSequencia();
  return `<button class="seqchip${q.n?'':' off'}${q.emRisco?' risco':''}" data-a="seq" aria-label="Sequência de ${q.n} dias de treino. Ver detalhes."><span class="fl" aria-hidden="true">🔥</span><b>${q.n}</b></button>`;
}
function linhaSeqHoje(){
  const q = minhaSequencia();
  if(q.hojeFeito || !q.hojeTreino) return '';
  if(q.emRisco) return `<div class="aviso n-alerta" role="status"><span class="av-i" aria-hidden="true">🔥</span><p><b>Sua sequência de ${q.n} ${q.n===1?'dia':'dias'} está em risco.</b> A proteção deste mês já foi usada: treine hoje para não zerar.</p></div>`;
  return q.n ? `<p class="seqline">🔥 Treine hoje e a sequência sobe para <b>${q.n+1}</b>.</p>` : '';
}
function seqSheet(){
  const q = minhaSequencia(), dias = new Set(diasTreinados()), prot = new Set(q.protegidos);
  const hoje = chaveDia(Date.now()), primeiro = [...dias].sort()[0] || hoje;
  const cel = Array.from({length:14}, (_,j)=>{ const dt = new Date(); dt.setHours(12,0,0,0); dt.setDate(dt.getDate()-(13-j)); const dk = chaveDia(dt.getTime());
    const plano = FICHA ? FICHA.sched[dt.getDay()] : null, treino = plano && plano!=='ativo' && plano!=='total';
    const st = dias.has(dk) ? 'ok' : prot.has(dk) ? 'prot' : dk===hoje ? 'hoje' : treino && dk>primeiro ? 'perdeu' : 'folga';
    const g = st==='ok' ? '🔥' : st==='prot' ? '🛡️' : st==='perdeu' ? '✕' : st==='hoje' ? '•' : '–';
    return `<span class="sq-d ${st}"><small>${WD[dt.getDay()]}</small><b>${g}</b></span>`; }).join('');
  openSheet(`<div class="sq-top"><span class="sq-fl" aria-hidden="true">🔥</span><b>${q.n}</b><small>${q.n===1?'dia de treino seguido':'dias de treino seguidos'}</small></div>
    <div class="sum two"><div class="tile"><div class="k">Recorde</div><div class="v">${q.recorde}<small> dias</small></div></div>
      <div class="tile"><div class="k">Proteção do mês</div><div class="v sm">${q.protecaoMes?'🛡️ disponível':'usada'}</div></div></div>
    <p class="lbl" style="margin-top:14px">Últimos 14 dias</p><div class="sq-grid">${cel}</div>
    <p class="note">Conta os dias em que você treinou. Dias de folga da ficha não quebram a sequência. Se faltar <b>um</b> dia de treino no mês, a proteção 🛡️ cobre sozinha. Faltando outro no mesmo mês, a sequência volta a zero.</p>
    <div class="btns"><button class="btn ghost" data-a="close">Fechar</button></div>`);
}

/* ----- 4. Missões da semana ----- */
function ctxMissoes(){
  const wk = startOfWeek(Date.now()), wkAnt = wk - 7*864e5, kw = chaveDia(wk);
  const sem = S.sessions.filter(s=>s.start>=wk), ant = S.sessions.filter(s=>s.start>=wkAnt && s.start<wk);
  const treinos = sem.filter(s=>!ehCardio(s));
  const metaDia = dk => metaAguaDe(dk);
  return {
    meta: metaSemana(), treinos: treinos.length, cardios: sem.length - treinos.length,
    recordes: treinos.reduce((n,s)=>n+findPRs(s).length, 0),
    peso: S.body.some(b=>b.d>=kw), completos: treinos.filter(s=>s.total && s.done>=s.total).length,
    sabado: sem.some(s=>new Date(s.start).getDay()===6),
    reacoes: new Set((S.reacoes||[]).filter(r=>r.from_user===UID && r.dia>=kw).map(r=>r.to_user+'|'+r.dia)).size,
    aguaDias: Object.entries(AGUA.dias).filter(([dk,ml])=>dk>=kw && ml>=metaDia(dk)).length,
    volume: treinos.reduce((n,s)=>n+(s.vol||0),0), volumeAntes: ant.filter(s=>!ehCardio(s)).reduce((n,s)=>n+(s.vol||0),0),
    grupo: !!S.grupo
  };
}
function missoesAtuais(){ return missoesDaSemana(ctxMissoes(), UID); }
// Marca as missões recém-cumpridas: cada uma vale 1 ponto de nível
function verificarMissoes(mostrar){
  if(!UID || !FICHA) return;
  const feitas = new Set(MISSOES);
  const novas = missoesAtuais().filter(m=>m.ok && !feitas.has(m.id));
  if(!novas.length) return;
  const nv0 = nivel(pontos());
  MISSOES = MISSOES.concat(novas.map(m=>m.id)).slice(-400);
  guardarCache();
  D.salvarMissoes(UID, MISSOES).catch(()=>{ LS.set('mt.missoes.pend.'+UID, true); });
  if(mostrar!==false){
    const m = novas[novas.length-1];
    setTimeout(()=>{ festa('🎯', 'Missão cumprida! +1 ponto', m.txt); confete(0.7); vibrar([40,40,60]); }, 900);
  }
  const nv1 = nivel(pontos());
  if(nv1.i>nv0.i) setTimeout(()=>avisarNivel(nv1), 4900);
  if(S.view==='hoje' && !$('#sheet:not([hidden])')) render();
}
function avisarNivel(nv){
  festa('⭐', 'Subiu para o nível '+nv.nome+'!', 'Continue assim!');
  confete(1.2);
}
function cardMissoes(){
  if(!FICHA) return '';
  const M = missoesAtuais(), ok = M.filter(m=>m.ok).length;
  const fim = new Date(startOfWeek(Date.now()) + 7*864e5), faltam = Math.max(1, Math.ceil((fim - Date.now())/864e5));
  return `<div class="section"><div class="card-h"><h2 class="h2">Missões da semana</h2><button class="link" data-a="missoes">${ok}/${M.length} · ${faltam} ${faltam===1?'dia':'dias'}</button></div>
    <div class="ms-list">${M.map(linhaMissao).join('')}</div></div>`;
}
function linhaMissao(m){
  const pct = Math.round(Math.min(1, m.feito/m.alvo)*100);
  const val = m.un==='t' ? fmtN(m.feito,1)+' de '+fmtN(m.alvo,1)+' t' : m.feito+'/'+m.alvo;
  return `<div class="ms${m.ok?' ok':''}"><span class="ms-i" aria-hidden="true">${m.ok?'✅':m.ico}</span><span class="ms-t"><b>${esc(m.txt)}</b>
    <span class="bar sm" aria-hidden="true"><i style="width:${pct}%"></i></span></span><small>${m.ok?'+1 ponto':val}</small></div>`;
}
function missoesSheet(){
  const M = missoesAtuais();
  openSheet(`<h2>Missões da semana</h2><p>Três metas que mudam toda segunda-feira. Cada missão cumprida vale <b>1 ponto</b> para o seu nível, além dos treinos.</p>
    <div class="ms-list">${M.map(linhaMissao).join('')}</div>
    <p class="note">Você já cumpriu <b>${MISSOES.length}</b> ${MISSOES.length===1?'missão':'missões'} no total.</p>
    <div class="btns"><button class="btn ghost" data-a="close">Fechar</button></div>`);
}

/* ----- Água ----- */
function pesoAtual(){ const b = S.body[S.body.length-1]; return b ? b.kg : null; }
function treinoNoDia(dk){ if(!FICHA) return false; const p = dk.split('-'); const v = FICHA.sched[new Date(+p[0], +p[1]-1, +p[2], 12).getDay()]; return !!v && v!=='ativo' && v!=='total'; }
function metaAguaDe(dk){ return metaAgua({ peso: pesoAtual(), manual: AGUA.manual, treinoHoje: treinoNoDia(dk) || S.sessions.some(s=>chaveDia(s.start)===dk && !ehCardio(s)) }); }
function aguaHoje(){ return AGUA.dias[chaveDia(Date.now())] || 0; }
let aguaT = null;
function salvarAguaDepois(){
  clearTimeout(aguaT);
  aguaT = setTimeout(async ()=>{
    const pend = LS.get('mt.agua.pend.'+UID, {});
    try{ await D.salvarAgua(UID, pend); LS.set('mt.agua.pend.'+UID, {}); }catch(e){ /* fica pendente e vai na próxima abertura */ }
  }, 900);
}
function addAgua(ml){
  const dk = chaveDia(Date.now()), meta = metaAguaDe(dk), antes = AGUA.dias[dk] || 0;
  const novo = Math.max(0, Math.min(20000, antes + ml));
  AGUA.dias[dk] = novo;
  const pilha = LS.get('mt.agua.desf.'+UID, []); if(ml>0) LS.set('mt.agua.desf.'+UID, pilha.concat([{dk, ml}]).slice(-20));
  const pend = LS.get('mt.agua.pend.'+UID, {}); pend[dk] = novo; LS.set('mt.agua.pend.'+UID, pend);
  guardarCache(); salvarAguaDepois();
  if(antes < meta && novo >= meta){ festa('💧', 'Meta de água batida!', litros(novo)+' L hoje. Seu corpo agradece.'); confete(0.8); vibrar([30,30,60]); }
  else if(ml>0) vibrar(15);
  atualizarAgua(); verificarMissoes();
}
function desfazerAgua(){
  const pilha = LS.get('mt.agua.desf.'+UID, []), dk = chaveDia(Date.now());
  const ult = pilha.length && pilha[pilha.length-1].dk===dk ? pilha.pop() : null;
  if(!ult){ toast('Nada para desfazer hoje.'); return; }
  LS.set('mt.agua.desf.'+UID, pilha);
  AGUA.dias[dk] = Math.max(0, (AGUA.dias[dk]||0) - ult.ml);
  const pend = LS.get('mt.agua.pend.'+UID, {}); pend[dk] = AGUA.dias[dk]; LS.set('mt.agua.pend.'+UID, pend);
  guardarCache(); salvarAguaDepois(); atualizarAgua();
}
function cardAgua(){
  return `<div class="section" id="agua-card">${blocoAgua()}</div>`;
}
function blocoAgua(){
  const dk = chaveDia(Date.now()), ml = aguaHoje(), meta = metaAguaDe(dk), pct = Math.min(100, Math.round(ml/meta*100));
  const copos = Math.max(0, Math.ceil((meta-ml)/250));
  return `<div class="agua${ml>=meta?' ok':''}">
    <button class="ag-g" data-a="agua" aria-label="Água: ${litros(ml)} de ${litros(meta)} litros. Ver detalhes."><span class="ag-w" style="height:${pct}%"></span><span class="ag-p">${pct}%</span></button>
    <div class="ag-m"><div class="card-h" style="margin:0"><h2 class="h2" style="margin:0">Água hoje</h2><button class="link" data-a="agua">detalhes</button></div>
      <p class="ag-v"><b>${litros(ml)}</b> de ${litros(meta)} L${ml>=meta?' · meta batida 🎉':copos?` · faltam ${copos} ${copos===1?'copo':'copos'}`:''}</p>
      <div class="ag-bts"><button class="chipbtn" data-a="agua+" data-ml="250" aria-label="Mais um copo, 250 ml">+250 ml</button><button class="chipbtn" data-a="agua+" data-ml="500" aria-label="Mais uma garrafa, 500 ml">+500 ml</button><button class="chipbtn ghost" data-a="agua-undo" aria-label="Desfazer o último registro de água">↩</button></div></div></div>`;
}
function atualizarAgua(){
  const c = $('#agua-card'); if(c) c.innerHTML = blocoAgua();
  if(!$('#sheet').hidden && $('#ag-sheet')) aguaSheet();
}
function aguaSheet(){
  const dk = chaveDia(Date.now()), ml = aguaHoje(), meta = metaAguaDe(dk), peso = pesoAtual();
  const dias = Array.from({length:7}, (_,j)=>{ const dt = new Date(); dt.setHours(12,0,0,0); dt.setDate(dt.getDate()-(6-j)); const k = chaveDia(dt.getTime()); return { k, wd: WD[dt.getDay()], ml: AGUA.dias[k]||0, meta: metaAguaDe(k) }; });
  const barras = dias.map(x=>`<span class="ag-c${x.ml>=x.meta?' ok':''}"><small class="ag-l">${x.ml?litros(x.ml):''}</small><span class="ag-t"><i style="height:${Math.min(100, Math.round(x.ml/x.meta*100))}%"></i></span><small>${x.wd}</small></span>`).join('');
  const auto = metaAgua({ peso, manual:null, treinoHoje:false });
  openSheet(`<div id="ag-sheet"><h2>Água</h2>
    <p class="ag-big"><b>${litros(ml)}</b> de ${litros(meta)} L hoje</p>
    <div class="ag-bts big">${[150,250,350,500,750].map(v=>`<button class="chipbtn" data-a="agua+" data-ml="${v}">+${v} ml</button>`).join('')}<button class="chipbtn ghost" data-a="agua-undo">↩ Desfazer</button></div>
    <p class="lbl" style="margin-top:16px">Últimos 7 dias <small class="ag-leg">(barra cheia = meta batida)</small></p><div class="ag-hist" aria-label="Água nos últimos 7 dias">${barras}</div>
    <p class="lbl" style="margin-top:16px">Meta diária</p>
    <p class="note" style="margin-top:0">${peso ? `Automática: 35 ml por kg (${fmtN(peso)} kg) = <b>${litros(auto)} L</b>, mais 0,5 L nos dias de treino.` : 'Automática: 2,5 L por dia, mais 0,5 L nos dias de treino. Registre seu peso para a meta ficar sob medida (35 ml por kg).'}</p>
    <div class="ag-mrow"><label class="lbl-in"><span>Meta própria (litros)</span><input class="inp" id="ag-meta" inputmode="decimal" placeholder="automática" value="${AGUA.manual?fmtN(AGUA.manual/1000,1):''}"></label>
    <button class="btn sm" data-a="agua-meta">Salvar</button></div>
    <p class="note">Deixe em branco para usar a meta automática. Se você tem alguma orientação médica sobre líquidos, use a meta que seu médico passou.</p>
    <div class="btns"><button class="btn ghost" data-a="close">Fechar</button></div></div>`);
}
async function salvarMetaAguaSheet(){
  const v = num(($('#ag-meta')||{}).value);
  const ml = v ? Math.round(v*1000) : null;
  if(ml && (ml<500 || ml>8000)){ toast('Use uma meta entre 0,5 e 8 litros.', true); return; }
  try{ await D.salvarMetaAgua(UID, ml); AGUA.manual = ml; guardarCache(); toast(ml ? 'Meta de água: '+litros(ml)+' L por dia.' : 'Meta automática ativada.'); aguaSheet(); if(S.view==='hoje') atualizarAgua(); }
  catch(e){ toast('Não consegui salvar agora. Confira a internet.', true); }
}

/* ----- 8. Temas ----- */
function temasSheet(){
  const cards = TEMAS.map(t=>{ const on = TEMA===t.id;
    return `<button class="tema${on?' on':''}" data-a="tema" data-t="${t.id}" aria-pressed="${on}">
      <span class="tm-sw" style="background:linear-gradient(135deg,${t.cor[0]},${t.cor[1]})">${on?'✓':''}</span>
      <b>${esc(t.nome)}</b><small>${on?'em uso':'toque para usar'}</small></button>`; }).join('');
  openSheet(`<h2>Temas</h2><p>Escolha as cores do app. Vale só para você e pode trocar quando quiser.</p>
    <div class="temas">${cards}</div><div class="btns" style="margin-top:14px"><button class="btn ghost" data-a="close">Fechar</button></div>`);
}
async function escolherTema(id){
  const t = TEMAS.find(x=>x.id===id); if(!t) return;
  TEMA = t.id; aplicarTema(TEMA); LS.set('mt.tema.'+UID, TEMA); guardarCache();
  temasSheet();
  try{ await D.salvarTema(UID, TEMA); }catch(e){}
}

/* ----- Grupo da família ----- */
function arroba(ig){ return ig ? `<span class="ig">@${esc(ig)}</span>` : ''; }
function miniAvatar(path, nome, cls){ return `<span class="avatar ${cls||'xs'}" aria-hidden="true">${path?`<img data-path="${esc(path)}" alt="">`:esc(iniciais(nome))}</span>`; }
function iniciais(n){ return (n||'?').trim().split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase(); }
/* ----- Notificações no celular ----- */
function estadoPush(sub){
  if(!suportaPush()) return ehIOS() && !pwaInstalado() ? 'ios' : 'sem';
  const p = permissao();
  if(p==='denied') return 'negado';
  return sub && p==='granted' ? 'on' : 'off';
}
async function sincronizarAparelho(){
  try{ if(permissao()!=='granted') return; const s = await assinaturaAtual(); if(s) await D.salvarAparelho(UID, s.toJSON()); }catch(e){}
}
function cardNotif(){
  if(!S.grupo || !suportaPush() || permissao()!=='default' || LS.get('mt.notif.ate', 0) > Date.now()) return '';
  return `<div class="aviso n-info inst" role="status"><span class="av-i" aria-hidden="true">🔔</span><p><b>Ative as notificações.</b> Saiba quando alguém da família terminar o treino, receber reações e lembrete nos dias de treino.<br><button class="btn sm primary" data-a="notif" style="margin-top:8px;width:auto">Ativar</button></p><button class="x" data-a="notif-x" aria-label="Agora não">×</button></div>`;
}
async function notifSheet(){
  const sub = suportaPush() ? await assinaturaAtual() : null;
  const st = estadoPush(sub);
  const topo = {
    on: `<div class="nt-st on">✅ <span><b>Ativadas neste aparelho.</b> Os avisos chegam mesmo com o app fechado.</span></div>
      <div class="btns two"><button class="btn sm" data-a="nt-teste">Enviar teste</button><button class="btn sm ghost" data-a="nt-off">Desativar aqui</button></div>`,
    off: `<button class="btn primary" data-a="nt-on">${ICON.bell} Ativar notificações neste aparelho</button>
      <p class="note">O celular vai perguntar se pode mostrar notificações. Toque em <b>Permitir</b>.</p>`,
    negado: `<div class="nt-st">🔕 <span><b>As notificações estão bloqueadas para o app.</b> Libere nas configurações do celular (Notificações › Meus Treinos) ou no cadeado ao lado do endereço, no navegador, e volte aqui.</span></div>`,
    ios: `<div class="nt-st">📲 <span><b>No iPhone, primeiro instale o app.</b> As notificações só funcionam pelo app na tela de início. Depois abra o app por lá e volte aqui.</span></div>
      <button class="btn" data-a="instalar">Como instalar</button>`,
    sem: `<div class="nt-st">ℹ️ <span>Este navegador não aceita notificações. No Android, abra o app pelo <b>Chrome</b>. No iPhone, pelo app instalado na tela de início.</span></div>`
  }[st];
  const ck = (id, on, txt) => `<label class="nt-ck"><input type="checkbox" id="${id}"${on?' checked':''}><span>${txt}</span></label>`;
  openSheet(`<h2>Notificações</h2>${topo}
    <p class="lbl" style="margin-top:18px">O que avisar</p>
    ${ck('nt-grupo', NOTIF.grupo!==false, 'Quando alguém do grupo terminar o treino')}
    ${ck('nt-reacoes', NOTIF.reacoes!==false, 'Quando reagirem ao meu treino')}
    ${ck('nt-resumo', NOTIF.resumo!==false, 'Resumo da semana no domingo à noite')}
    ${ck('nt-avisos', NOTIF.avisos!==false, 'Avisos do app (academia fechada, mudanças…)')}
    ${ck('nt-lem', !!LEM_HORA && NOTIF.lembrete!==false, 'Lembrete nos dias de treino')}
    <label class="lbl-in nt-hora"><span>Horário do lembrete</span><input class="inp" id="nt-hora" type="time" value="${esc(LEM_HORA || LS.get('mt.lembrete', {h:'18:00'}).h || '18:00')}"></label>
    <p class="note">O lembrete chega só nos dias que têm treino na ficha, e não chega se você já treinou. Vale para todos os seus aparelhos.</p>
    <div class="btns" style="margin-top:12px"><button class="btn primary" data-a="nt-save">Salvar</button><button class="btn ghost" data-a="close">Fechar</button></div>`);
}
function erroPush(e){
  const c = e && e.message;
  return c==='negado' ? 'Permissão negada. Libere as notificações nas configurações do celular.' :
    c==='sem_resposta' ? 'Sem permissão ainda. Toque em Ativar e depois em Permitir.' :
    c==='sem_sw' ? 'Abra o app pelo endereço principal (não em aba anônima) e tente de novo.' :
    /incognito|anônim|AbortError|NotAllowed/i.test(String(c)+' '+(e&&e.name)) ? 'Este navegador não deixou ativar. Abra o app instalado (ou no Chrome, fora da aba anônima) e tente de novo.' :
    'Não consegui ativar agora. Confira a internet e tente de novo.';
}
async function ativarNotif(){
  if(S.busy) return; S.busy = true;
  try{
    const vapid = await D.chaveVapid();
    if(!vapid) throw new Error('sem_chave');
    const sub = await assinar(vapid);
    await D.salvarAparelho(UID, sub);
    await enviarTesteNotif(true);
    toast('Notificações ativadas neste aparelho.');
  }catch(e){ toast(erroPush(e), true); }
  S.busy = false;
  notifSheet();
}
async function desativarNotif(){
  try{ const ep = await cancelarPush(); await D.apagarAparelho(ep); toast('Notificações desativadas neste aparelho.'); }
  catch(e){ toast('Não consegui desativar agora.', true); }
  notifSheet();
}
async function enviarTesteNotif(silencioso){
  try{ await D.testeNotif(); if(!silencioso) toast('Teste enviado. Deve chegar em alguns segundos.'); }
  catch(e){ if(!silencioso) toast('Não consegui enviar o teste agora.', true); }
}
async function salvarNotif(){
  const v = id => { const el = $('#'+id); return el ? el.checked : true; };
  const hora = ($('#nt-hora') && $('#nt-hora').value) || '';
  const lem = v('nt-lem');
  const notif = { grupo: v('nt-grupo'), reacoes: v('nt-reacoes'), lembrete: lem, resumo: v('nt-resumo'), avisos: v('nt-avisos') };
  try{
    await D.salvarPrefsNotif(UID, notif, lem ? hora : null);
    NOTIF = notif; LEM_HORA = lem ? hora : '';
    closeSheet(); toast(lem && hora ? `Salvo. Lembrete às ${hora} nos dias de treino.` : 'Preferências salvas.');
  }catch(e){ toast('Não consegui salvar agora. Confira a internet.', true); }
}
/* ----- Treino em grupo ao vivo ----- */
// A cada poucos segundos (só com o app aberto) busca quem do grupo está treinando e quantas
// séries de cada exercício já fez. Mostra no topo do treino, em cada exercício e no card do grupo.
const VIVO_MS = 15000;
let vivoTimer = null, vivoN = 0, vivoBuscando = false;
function primeiroNome(n){ const p = String(n||'').trim().split(/\s+/)[0] || 'Alguém'; return p.charAt(0).toUpperCase()+p.slice(1).toLowerCase(); }
function pessoaGrupo(uid){ return (S.grupoM||[]).find(m=>m.uid===uid) || {nome:'Alguém', avatar:'', insta:''}; }
function vivosOutros(){ return S.vivo ? S.vivo.filter(v=>v.uid!==UID && v.letra && v.ex.length) : []; }
function exAtual(v){ return v.ex.find(e=>e.f>0 && e.f<e.t) || v.ex.find(e=>e.f<e.t) || null; }
function feitosVivo(v){ return v.ex.filter(e=>e.t && e.f>=e.t).length; }
function iniciarVivo(){
  if(vivoTimer) return;
  vivoTimer = setInterval(()=>{ vivoN++; atualizarVivo(); }, VIVO_MS);
  atualizarVivo();
}
function pararVivo(){ clearInterval(vivoTimer); vivoTimer = null; S.vivo = null; }
async function atualizarVivo(forcar){
  if(!S.grupo || !UID || vivoBuscando || document.hidden || !navigator.onLine) return;
  const naSessao = S.view==='sessao', naHoje = S.view==='hoje';
  if(!forcar && !naSessao && !naHoje) return;
  // fora do treino, só olha com mais frequência se alguém estiver treinando
  if(!forcar && naHoje && !vivosOutros().length && vivoN % 4) return;
  vivoBuscando = true;
  try{
    const novo = await D.aoVivoGrupo(S.grupo.id);
    avisarVivo(S.vivo, novo);
    const antes = vivosOutros().map(v=>v.uid+v.letra).join();
    S.vivo = novo;
    const depois = vivosOutros().map(v=>v.uid+v.letra).join();
    if(S.view==='sessao') atualizarVivoSessao();
    else if(S.view==='hoje' && (antes!==depois || vivosOutros().length)) atualizarVivoHoje();
  }catch(e){}
  vivoBuscando = false;
}
function avisarVivo(ant, novo){
  if(!ant) return; // primeira busca: não avisa o que já tinha acontecido
  const msgs = [];
  novo.forEach(v=>{
    if(v.uid===UID) return;
    const a = ant.find(x=>x.uid===v.uid); if(!a) return;
    const nome = primeiroNome(pessoaGrupo(v.uid).nome);
    if(v.letra && a.letra===v.letra){
      v.ex.forEach((e,i)=>{ const ae = a.ex[i]; if(e.t && e.f>=e.t && ae && ae.f<ae.t) msgs.push(`${nome} terminou ${e.n.toLowerCase()} 💪`); });
    }
    if(!v.letra && a.letra && v.fim && v.fim > (a.at||0) - 60000) msgs.push(`${nome} finalizou o Treino ${v.fimLetra || a.letra} 🎉`);
    else if(v.letra && !a.letra) msgs.push(`${nome} começou o Treino ${v.letra}`);
  });
  if(msgs.length){ toast(msgs.slice(0,2).join(' · ')); try{ navigator.vibrate && navigator.vibrate(60); }catch(e){} }
}
function vivoBarra(){
  const vs = vivosOutros(); if(!vs.length) return '';
  return `<button class="vivo-bar" data-a="vivo"><span class="vivo-l"><span class="vivo-dot" aria-hidden="true"></span>Ao vivo</span>
    <span class="vivo-ps">${vs.map(v=>{ const p = pessoaGrupo(v.uid), at = exAtual(v);
      return `<span class="vivo-p">${miniAvatar(p.avatar, p.nome)}<span><b>${esc(primeiroNome(p.nome))}</b> ${feitosVivo(v)}/${v.ex.length}${at?` · ${esc(at.n)}`:' · finalizando'}</span></span>`; }).join('')}</span>
    <span class="chev" aria-hidden="true">›</span></button>`;
}
function vivoDoEx(e){
  const k = chaveVideo(e.n), out = [];
  vivosOutros().forEach(v=>{
    const x = v.ex.find(y=>chaveVideo(y.n)===k); if(!x || !x.f) return;
    const nome = primeiroNome(pessoaGrupo(v.uid).nome);
    out.push(x.f>=x.t ? `<span class="vx ok">✓ ${esc(nome)}</span>` : `<span class="vx">${esc(nome)} ${x.f}/${x.t}</span>`);
  });
  return out.join('');
}
function atualizarVivoSessao(){
  const bar = $('#vivo-bar'); if(bar) bar.innerHTML = vivoBarra();
  if(S.draft) S.draft.w.ex.forEach((e,i)=>{ const el = $('#vivo-ex-'+i); if(el) el.innerHTML = vivoDoEx(e); });
  hidratarFotos();
}
function atualizarVivoHoje(){
  const card = $('#grupo-card'); if(!card) return;
  card.outerHTML = grupoCard(); hidratarFotos();
}
function vivoTag(uid){
  if(uid===UID || !S.vivo) return '';
  const v = S.vivo.find(x=>x.uid===uid); if(!v) return '';
  if(v.letra && v.ex.length) return `<span class="vivo-tag"><span class="vivo-dot" aria-hidden="true"></span>Treinando agora · ${feitosVivo(v)}/${v.ex.length}</span>`;
  return '';
}
function vivoSheet(){
  const vs = vivosOutros();
  if(!vs.length){ openSheet(`<h2>Ao vivo</h2><p>Ninguém do grupo está treinando agora.</p><div class="btns"><button class="btn ghost" data-a="close">Fechar</button></div>`); return; }
  openSheet(`<p class="eyebrow"><span class="dot"></span> Ao vivo</p><h2 style="margin-top:6px">Treinando agora</h2>
    ${vs.map(v=>{ const p = pessoaGrupo(v.uid), m0 = v.inicio ? Math.max(1, Math.round((Date.now()-v.inicio)/60000)) : 0, min = m0 < 300 ? m0 : 0;
      return `<div class="vivo-pess"><div class="vivo-h">${miniAvatar(p.avatar, p.nome, 'sm')}<span><b>${esc(p.nome||'Alguém')}</b>${arroba(p.insta)}<small>Treino ${esc(v.letra)} · ${esc(v.treino)}${min?` · ${min} min`:''}</small></span></div>
        <ol class="vivo-ex">${v.ex.map(e=>`<li class="${e.t && e.f>=e.t?'ok':e.f?'meio':''}"><span>${esc(e.n)}</span><b>${e.t && e.f>=e.t?'✓':`${e.f}/${e.t}`}</b></li>`).join('')}</ol></div>`; }).join('')}
    <p class="note">Aparece só o andamento das séries. As cargas continuam só de cada um.</p>
    <div class="btns"><button class="btn ghost" data-a="close">Fechar</button></div>`);
  hidratarFotos();
}
function grupoCard(){
  if(!S.grupo){
    if(S.grupoErr) return '';
    return `<div class="section" id="grupo-card"><button class="gcta" data-a="grupo"><span class="ci">${ICON.users}</span><span><b>Treinar junto com a família</b><small>Crie um grupo e vejam quem treinou na semana.</small></span><span class="chev" aria-hidden="true">›</span></button></div>`;
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
      const naSemana = [...set].filter(d=>d>=chaveDia(wk) && d<=hoje).sort();
      return Object.assign({}, m, { eu, dots, nSem:dots.filter(x=>x.feito).length, nMes:[...set].filter(d=>d.slice(0,7)===mes).length, seq:semanasAtivas(dias, agora), ultimo: naSemana[naSemana.length-1] || null });
    }).sort((a,b)=> b.nSem-a.nSem || b.nMes-a.nMes || a.nome.localeCompare(b.nome));
    const topo = linhas.length>1 && linhas[0].nSem>0 && linhas[1].nSem<linhas[0].nSem ? linhas[0].nSem : -1;
    corpo = linhas.map(m=>`<div class="gm${m.eu?' eu':''}">
      <span class="avatar sm" aria-hidden="true">${m.avatar?`<img data-path="${esc(m.avatar)}" alt="">`:esc(iniciais(m.nome))}</span>
      <span class="gm-n"><b>${esc(m.eu ? 'Você' : (m.nome||'Sem nome'))}${m.nSem===topo?' <span title="Mais dias na semana">👑</span>':''}</b>${arroba(m.eu ? INSTA : m.insta)}
        <small>${m.nMes} ${m.nMes===1?'dia':'dias'} no mês${m.seq?' · 🔥 '+m.seq+(m.seq===1?' semana':' semanas'):''}</small>${vivoTag(m.uid)}</span>
      <span class="gm-dots" aria-label="${m.nSem} ${m.nSem===1?'dia':'dias'} de treino nesta semana">${m.dots.map(x=>`<i class="${x.feito?'on':''}${x.hoje?' hj':''}${x.fut?' fut':''}"></i>`).join('')}</span>
      <span class="gm-c" aria-hidden="true">${m.nSem}</span>${linhaReacoes(m)}</div>`).join('');
  }
  return `<div class="section" id="grupo-card"><div class="card-h"><h2 class="h2">${esc(S.grupo.nome)}</h2><button class="link" data-a="grupo">${ICON.users} Convidar</button></div>
    <section class="card gcard">${corpo}<p class="note gfoot">Ranking pelos dias de treino da semana. Semana ativa = 3 ou mais dias.</p></section></div>`;
}
const AVISO_GRUPO = `<p class="note">No grupo, os outros veem só seu nome, foto, @, os dias em que você treinou e, enquanto você treina, quais exercícios já fez. Cargas, peso, medidas e fotos de evolução continuam só seus.</p>`;
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
    S.reacoes = S.grupo ? await D.listarReacoes(chaveDia(startOfWeek(Date.now()))).catch(()=>[]) : [];
    avisarReacoesNovas(); verificarMissoes(false);
    S.grupoErr = false; LS.set(kGrupo(), {g:S.grupo, m:S.grupoM});
    if(S.grupo) iniciarVivo(); else pararVivo();
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
  openSheet(`<h2>Lembretes de treino</h2>${suportaPush()||ehIOS()?`<button class="gcta" data-a="notif" style="margin-bottom:12px"><span class="ci">${ICON.bell}</span><span><b>Prefere notificação do app?</b><small>Aviso no celular na hora do treino, só nos dias de treino.</small></span><span class="chev" aria-hidden="true">›</span></button>`:''}<p>Ou pelo calendário: o app cria um evento que se repete toda semana em cada dia de treino. O calendário do celular avisa sozinho, mesmo com o app fechado.</p>
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



/* ----- Reações no grupo ----- */
const EMOJIS = ['👏','🔥','💪'];
function linhaReacoes(m){
  if(!m.ultimo) return '';
  const R = (S.reacoes||[]).filter(r=>r.to_user===m.uid && r.dia===m.ultimo);
  const quando = m.ultimo===chaveDia(Date.now()) ? 'hoje' : shortDay(m.ultimo).slice(0,5);
  if(m.eu){
    if(!R.length) return '';
    const pess = {}; (S.grupoM||[]).forEach(x=>{ pess[x.uid] = x; });
    const ids = [...new Set(R.map(r=>r.from_user))];
    const quem = ids.map(id=>{ const x = pess[id]||{}; return x.insta ? '@'+x.insta : (x.nome||'Alguém'); }).join(', ');
    return `<div class="gm-r recebidas"><span class="rx-av">${ids.slice(0,4).map(id=>{ const x = pess[id]||{}; return miniAvatar(x.avatar, x.nome); }).join('')}</span><span>${EMOJIS.map(e=>{ const n = R.filter(r=>r.emoji===e).length; return n?`${e} ${n}`:''; }).filter(Boolean).join('  ')}</span><small>${esc(quem)} no seu treino de ${quando}</small></div>`;
  }
  return `<div class="gm-r"><small>Treino de ${quando}:</small>${EMOJIS.map(e=>{
    const meu = R.find(r=>r.from_user===UID && r.emoji===e), n = R.filter(r=>r.emoji===e).length;
    return `<button class="rx${meu?' on':''}" data-a="reagir" data-u="${esc(m.uid)}" data-d="${esc(m.ultimo)}" data-e="${e}" aria-pressed="${!!meu}" aria-label="Mandar ${e} para ${esc(m.nome||'')}">${e}${n?`<b>${n}</b>`:''}</button>`; }).join('')}</div>`;
}
async function reagir(btn){
  const to = btn.dataset.u, dia = btn.dataset.d, emoji = btn.dataset.e;
  const meu = (S.reacoes||[]).find(r=>r.from_user===UID && r.to_user===to && r.dia===dia && r.emoji===emoji);
  btn.disabled = true;
  try{
    if(meu){ await D.desreagir(meu.id); S.reacoes = S.reacoes.filter(r=>r.id!==meu.id); }
    else { const r = await D.reagir(to, dia, emoji); S.reacoes = S.reacoes.concat([r]); }
    render(); verificarMissoes();
  }catch(e){ btn.disabled = false; toast('Não consegui mandar agora. Confira a internet.', true); }
}
function avisarReacoesNovas(){
  const k = 'mt.rx.'+UID, vistas = new Set(LS.get(k, []));
  const novas = (S.reacoes||[]).filter(r=>r.to_user===UID && !vistas.has(r.id));
  if(novas.length){
    const nomes = {}; (S.grupoM||[]).forEach(x=>{ nomes[x.uid] = (x.nome||'Alguém')+(x.insta?' (@'+x.insta+')':''); });
    const txt = novas.slice(0,3).map(r=>(nomes[r.from_user]||'Alguém')+' mandou '+r.emoji).join(' · ');
    setTimeout(()=>toast(txt+' no seu treino!'), 600);
  }
  LS.set(k, (S.reacoes||[]).filter(r=>r.to_user===UID).map(r=>r.id).slice(-200));
}

/* ----- Cardio ----- */
function cardioSheet(){
  const ult = LS.get('mt.cardio', {tipo:'Esteira', min:''});
  S.cdTipo = ult.tipo;
  S.cdInt = LS.get('mt.cardio.int', 'forte');
  openSheet(`<h2>Registrar cardio ou aula</h2><p>Conta como dia de treino na semana, no grupo e nas conquistas.</p>
    <div class="aulas">${Object.entries(AULAS).map(([t,a])=>`<button class="aula-b${t===S.cdTipo?' on':''}" data-a="cd-tipo" data-t="${t}"><span aria-hidden="true">${a.ico}</span><b>${t}</b><small>aula</small></button>`).join('')}</div>
    <p class="lbl" style="margin-top:12px">Outros cardios</p>
    <div class="chips-sel" id="cd-tipos">${CARDIO_TIPOS.map(t=>`<button class="chip-b${t===S.cdTipo?' on':''}" data-a="cd-tipo" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    <div id="cd-int"></div>
    <div class="fgrid cd">
      <label><span>Minutos</span><input class="inp" id="cd-min" inputmode="numeric" value="${esc(LS.get('mt.cardio.min.'+S.cdTipo, ult.min||''))}" placeholder="${AULAS[S.cdTipo]?'45':'30'}"></label>
      <label id="cd-km-l"><span>Distância (km)</span><input class="inp" id="cd-km" inputmode="decimal" placeholder="opcional"></label>
      <label><span>Calorias</span><input class="inp" id="cd-kcal" inputmode="numeric" placeholder="opcional"></label>
      <label><span>Dia</span><input class="inp" id="cd-d" type="date" value="${dayKey(Date.now())}" max="${dayKey(Date.now())}"></label></div>
    <p class="note" id="cd-est" hidden></p>
    <textarea class="notes sm" id="cd-obs" placeholder="Observações (opcional): professor, como se sentiu…"></textarea>
    <div class="btns" style="margin-top:12px"><button class="btn primary" data-a="cd-save" id="cd-save">Salvar</button><button class="btn ghost" data-a="close">Cancelar</button></div>`);
  ajustarCardio();
}
// Mostra intensidade e estimativa de calorias quando é aula (spinning, jump)
function ajustarCardio(){
  const t = S.cdTipo, a = AULAS[t];
  document.querySelectorAll('[data-a="cd-tipo"]').forEach(b=>b.classList.toggle('on', b.dataset.t===t));
  const box = $('#cd-int'); if(!box) return;
  box.innerHTML = a ? `<p class="lbl">Intensidade da aula</p><div class="intens">${INTENS.map(([k,l,d])=>`<button class="int-b${k===S.cdInt?' on':''}" data-a="cd-int" data-k="${k}"><b>${l}</b><small>${d}</small></button>`).join('')}</div>` : '';
  const kmL = $('#cd-km-l'); if(kmL) kmL.hidden = !!a && !a.km;
  const sv = $('#cd-save'); if(sv) sv.textContent = a ? 'Salvar aula de '+t.toLowerCase() : 'Salvar cardio';
  estimarCardio();
}
function estimarCardio(){
  const est = $('#cd-est'), kc = $('#cd-kcal'); if(!est || !kc) return;
  const a = AULAS[S.cdTipo];
  if(!a){ est.hidden = true; kc.placeholder = 'opcional'; return; }
  const min = parseInt($('#cd-min').value, 10);
  const k = kcalAula(S.cdTipo, S.cdInt, min);
  est.hidden = false;
  if(!S.body.length){ est.innerHTML = 'Registre seu peso (Evolução › Corpo) para o app estimar as calorias da aula. Ou digite as calorias do seu relógio.'; kc.placeholder = 'opcional'; return; }
  kc.placeholder = k ? '≈ '+k : 'opcional';
  est.innerHTML = k ? `Estimativa: <b>≈ ${k} kcal</b> (${fmtN(S.body[S.body.length-1].kg)} kg, intensidade ${S.cdInt}). Se tiver o número do relógio, digite nas calorias.` : 'Informe os minutos para estimar as calorias.';
}
function lerCardio(){
  const min = parseInt($('#cd-min').value, 10), km = num($('#cd-km').value), kcal = parseInt($('#cd-kcal').value, 10);
  if(!(min>=1 && min<=600)){ toast('Informe quantos minutos durou (1 a 600).', true); return null; }
  if(km!=null && !(km>0 && km<200)){ toast('Confira a distância.', true); return null; }
  const aula = !!AULAS[S.cdTipo];
  const est = aula && !(kcal>0) ? kcalAula(S.cdTipo, S.cdInt, min) : null;
  return { min, km: km||null, kcal: kcal>0 ? kcal : est, kcalEst: !!est, intens: aula ? S.cdInt : null, d: $('#cd-d').value || dayKey(Date.now()), obs: ($('#cd-obs').value||'').trim() };
}
function salvarCardio(){
  const c = lerCardio(); if(!c) return;
  const tipo = S.cdTipo || 'Outro';
  LS.set('mt.cardio', {tipo, min:c.min}); LS.set('mt.cardio.min.'+tipo, c.min); if(c.intens) LS.set('mt.cardio.int', c.intens);
  const hoje = c.d===dayKey(Date.now());
  const fim = hoje ? Date.now() : new Date(c.d+'T19:00').getTime();
  const s = { id:uuid(), planId:null, letter:'CARDIO', wname:tipo, start: fim - c.min*60000, end: fim, dur: c.min*60, notes:c.obs,
    ex:[{ key:'cardio', keys:[], n:tipo, parts:[tipo], sets:[], cardio:Object.assign({ min:c.min, km:c.km, kcal:c.kcal }, c.intens ? { aula:true, intens:c.intens, kcalEst:c.kcalEst } : {}) }], vol:0, done:0, total:0 };
  const r = registrarSessao(s);
  closeSheet(true); go('hoje');
  abrirCompartilhar('semana', s, (AULAS[tipo] ? AULAS[tipo].ico+' Aula de '+tipo.toLowerCase()+' salva! '+c.min+' min'+(c.kcal?' · '+(c.kcalEst?'≈ ':'')+c.kcal+' kcal':'')+'.' : 'Cardio salvo! '+c.min+' min de '+tipo.toLowerCase()+'.')+r.extra, r.selo);
  verificarMissoes();
  enviarPendentes();
}

/* ----- Corrigir treino salvo ----- */
function editarTreinoSheet(id){
  const s = S.sessions.find(x=>x.id===id); if(!s) return;
  S.editS = copia(s);
  desenharEdicaoTreino();
}
function desenharEdicaoTreino(){
  const s = S.editS;
  if(ehCardio(s)){
    const c = dadosCardio(s);
    openSheet(`<h2>Editar cardio</h2>
      <div class="chips-sel">${CARDIO_TIPOS.map(t=>`<button class="chip-b${t===s.wname?' on':''}" data-a="he-tipo" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      <div class="fgrid cd"><label><span>Minutos</span><input class="inp" data-he="min" inputmode="numeric" value="${mins(s.dur)}"></label>
        <label><span>Distância (km)</span><input class="inp" data-he="km" inputmode="decimal" value="${c.km!=null?esc(fmtN(c.km,2)):''}"></label>
        <label><span>Calorias</span><input class="inp" data-he="kcal" inputmode="numeric" value="${c.kcal||''}"></label></div>
      <textarea class="notes sm" data-he="notes" placeholder="Observações">${esc(s.notes||'')}</textarea>
      <div class="btns" style="margin-top:12px"><button class="btn primary" data-a="he-save">Salvar alterações</button><button class="btn ghost" data-a="hist" data-id="${esc(s.id)}">Cancelar</button></div>`);
    return;
  }
  const ex = (s.ex||[]).map((e,ei)=>{
    const parts = e.parts || [e.n];
    const sets = e.sets.map((st,si)=>`<div class="he-set"><span class="set-n">${si+1}</span><div class="set-parts">${parts.map((pn,pi)=>{ const p = st.p[pi]||{};
      return `<div class="part">${parts.length>1?`<span class="plabel">${esc(pn)}</span>`:''}<label class="fld"><input data-he="${ei}.${si}.${pi}.kg" inputmode="decimal" value="${p.kg!=null?esc(String(p.kg).replace('.',',')):''}" aria-label="${esc(pn)}, série ${si+1}, carga"><span>kg</span></label>
        <label class="fld"><input data-he="${ei}.${si}.${pi}.r" inputmode="numeric" value="${p.r!=null?esc(p.r):''}" aria-label="${esc(pn)}, série ${si+1}, repetições"><span>reps</span></label></div>`; }).join('')}</div>
      <button class="mini del" data-a="he-del" data-ei="${ei}" data-si="${si}" aria-label="Apagar série ${si+1}">×</button></div>`).join('');
    return `<div class="dex"><b>${esc(e.n)}</b>${sets || '<p class="note">Sem séries.</p>'}</div>`;
  }).join('');
  openSheet(`<h2>Corrigir Treino ${esc(s.letter)}</h2><p style="text-transform:capitalize">${esc(fmtDate(s.start))} · ${esc(s.wname)}</p>
    ${ex}
    <label class="lbl">Duração (minutos)</label><input class="inp" data-he="min" inputmode="numeric" value="${mins(s.dur)}">
    <label class="lbl">Observações</label><textarea class="notes sm" data-he="notes">${esc(s.notes||'')}</textarea>
    <div class="btns" style="margin-top:12px"><button class="btn primary" data-a="he-save">Salvar alterações</button><button class="btn ghost" data-a="hist" data-id="${esc(s.id)}">Cancelar</button></div>`);
}
function editarCampoTreino(el){
  const s = S.editS, k = el.dataset.he, v = el.value;
  if(k==='notes'){ s.notes = v; return; }
  if(k==='min'){ const m = parseInt(v,10); if(m>0) s.dur = m*60; return; }
  if(k==='km' || k==='kcal'){ const c = s.ex[0].cardio = s.ex[0].cardio || {}; c[k] = k==='km' ? num(v) : (parseInt(v,10)||null); return; }
  const [ei, si, pi, f] = k.split('.'); const st = s.ex[+ei].sets[+si];
  st.p[+pi] = st.p[+pi] || {}; st.p[+pi][f] = num(v);
}
async function salvarEdicaoTreino(btn){
  const s = S.editS; if(!s) return;
  if(ehCardio(s)){ s.ex[0].cardio.min = mins(s.dur); }
  else {
    s.ex = s.ex.filter(e=>e.sets.length);
    s.vol = sessionVolume(s.ex);
    s.done = s.ex.reduce((n,e)=>n+e.sets.length, 0);
    s.total = Math.max(s.total||0, s.done);
  }
  s.end = s.start + s.dur*1000;
  btn.disabled = true;
  S.sessions = S.sessions.map(x=>x.id===s.id ? s : x);
  S.pending = S.pending.filter(p=>p.id!==s.id).concat([s]); LS.set(kPending(), S.pending);
  S.editS = null; closeSheet(true); render();
  await enviarPendentes();
  toast(S.pending.some(p=>p.id===s.id) ? 'Alterações guardadas. Sobem quando a internet voltar.' : 'Treino corrigido.');
}

/* ----- Aquecimento sugerido (da biblioteca) ----- */
const AQ = {
  superior: ['Mobilidade Dinâmica de Ombro','Mobilidade Torácica','Mobilidade de Ombro Rotacional','Mobilidade com o Bastão'],
  inferior: ['Mobilidade de Quadril','Mobilidade de Tornozelo','Maior do Mundo','Alongamento dinâmico Posterior de coxa'],
  completo: ['Maior do Mundo','Mobilidade de Quadril + Torácica','Mobilidade Dinâmica de Ombro']
};
function regiaoDoTreino(W){
  let sup = 0, inf = 0;
  (W.ex||[]).forEach(e=>{ const n = String(e.n||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
    if(/supino|puxada|remada|desenvolvimento|rosca|triceps|elevacao lateral|elevacao frontal|crucifixo|fly|pullover|pulldown|press|flexao de braco|barra fixa/.test(n)) sup++;
    if(/agachamento|leg|extensora|flexora|stiff|afundo|bulgaro|pelvica|panturrilha|abdutora|adutora|terra|passada|gluteo|quadril/.test(n)) inf++; });
  return sup && inf && Math.min(sup,inf)/Math.max(sup,inf) > 0.4 ? 'completo' : sup >= inf ? 'superior' : 'inferior';
}
function blocoAquecimento(W){
  if(!W || !CATALOGO.length) return '';
  const reg = regiaoDoTreino(W);
  const itens = AQ[reg].map(t=>CATALOGO.find(c=>c.titulo.toLowerCase()===t.toLowerCase())).filter(Boolean).slice(0,3);
  if(!itens.length) return '';
  return `<details class="aq"><summary><span>🔥 Aquecimento sugerido</span><small>${reg==='superior'?'ombro e coluna':reg==='inferior'?'quadril e tornozelo':'corpo todo'} · 5 min · opcional</small></summary>
    <p class="note" style="margin-top:6px">Faça 1 a 2 voltas, sem pressa, antes da primeira série.</p>
    ${itens.map(c=>`<a class="bib-i" href="https://www.youtube.com/watch?v=${esc(c.youtube)}" data-video="1" data-t="${esc(c.titulo)}" target="_blank" rel="noopener noreferrer"><span>${esc(c.titulo)}</span><span class="pl" aria-hidden="true">${ICON.play}</span></a>`).join('')}</details>`;
}

/* ----- Estagnação de carga ----- */
const estagCache = { n:-1, map:{} };
function estagnacao(key){
  if(estagCache.n !== S.sessions.length){ estagCache.n = S.sessions.length; estagCache.map = {}; }
  if(key in estagCache.map) return estagCache.map[key];
  const pontos = [];
  S.sessions.forEach(s=>(s.ex||[]).forEach(e=>{ const i = (e.keys||[]).indexOf(key); if(i<0) return;
    let best = 0; (e.sets||[]).forEach(st=>{ const kg = num(st.p[i]&&st.p[i].kg), r = num(st.p[i]&&st.p[i].r); if(kg>0 && r>0) best = Math.max(best, kg*(1+r/30)); });
    if(best>0) pontos.push({t:s.start, v:best}); }));
  pontos.sort((a,b)=>a.t-b.t);
  let res = null;
  if(pontos.length >= 4){
    let topo = pontos[0];
    pontos.forEach(p=>{ if(p.v > topo.v*1.005) topo = p; });
    const depois = pontos.filter(p=>p.t > topo.t).length;
    const dias = (Date.now() - topo.t)/864e5;
    const ultimo = pontos[pontos.length-1];
    if(depois >= 3 && dias >= 21 && Date.now() - ultimo.t < 21*864e5) res = { semanas: Math.floor(dias/7), desde: topo.t };
  }
  return (estagCache.map[key] = res);
}
function avisoEstagnado(e){
  const x = estagnacao(e.keys ? e.keys[0] : e.key); if(!x) return '';
  return `<p class="sug estag"><b>⚠ Sem evoluir há ${x.semanas} semanas.</b> Faça uma semana mais leve (cerca de 10% menos carga) e depois volte a subir, ou troque por uma variação${S.draft?' (botão Trocar)':''}.</p>`;
}
function blocoEstagnados(){
  if(!FICHA) return '';
  const lista = [];
  FICHA.order.forEach(L=>FICHA.W[L].ex.forEach(e=>{ const x = estagnacao(e.keys[0]); if(x && !lista.some(l=>l.n===e.n)) lista.push({n:e.n, L, x}); }));
  if(!lista.length) return '';
  return `<section class="card estag-c" style="margin-bottom:12px"><h2 class="h2">⚠ Sem evoluir</h2>
    ${lista.map(l=>`<div class="estag-l"><b>${esc(l.n)}</b><small>Treino ${l.L} · melhor marca há ${l.x.semanas} semanas</small></div>`).join('')}
    <p class="note">Sugestão: uma semana com cerca de 10% menos carga (deload) e depois retomar a progressão, ou trocar por uma variação do exercício.</p></section>`;
}

/* ----- Ficha vencendo ----- */
function semanasDaFicha(){
  if(!FICHA) return null;
  const doPlano = S.sessions.filter(s=>s.planId===FICHA.id);
  const primeiro = doPlano.length ? doPlano[doPlano.length-1].start : null;
  const inicio = Math.min(FICHA.criada || Infinity, primeiro || Infinity);
  if(!isFinite(inicio)) return null;
  return Math.floor((Date.now() - inicio)/(7*864e5));
}
function cardFichaVencendo(){
  const sem = semanasDaFicha(); if(sem==null || sem < 8) return '';
  const k = 'mt.fichaaviso.'+FICHA.id, ate = LS.get(k, 0); if(ate > Date.now()) return '';
  return `<div class="aviso n-alerta" role="status"><span class="av-i" aria-hidden="true">📋</span><p>Sua ficha está em uso há <b>${sem} semanas</b>. Costuma ser hora de pedir uma ficha nova ao personal para continuar evoluindo.</p><button class="x" data-a="ficha-ok" aria-label="Lembrar daqui a 2 semanas">×</button></div>`;
}

/* ----- Metas de peso e gordura ----- */
function serieMedida(k){
  const pts = [];
  if(k==='peso') S.body.forEach(b=>pts.push({t:new Date(b.d+'T12:00').getTime(), v:b.kg}));
  S.measures.forEach(m=>{ const v = mVal(m, k==='peso'?'peso':'gordura_pct'); if(v!=null) pts.push({t:new Date(m.d+'T12:00').getTime(), v:Number(v)}); });
  const porDia = new Map(); pts.forEach(p=>porDia.set(p.t, p)); return [...porDia.values()].sort((a,b)=>a.t-b.t);
}
function ritmoSemanal(pts){
  const rec = pts.filter(p=>p.t >= Date.now() - 70*864e5); if(rec.length < 2) return null;
  const n = rec.length, mx = rec.reduce((a,p)=>a+p.t,0)/n, my = rec.reduce((a,p)=>a+p.v,0)/n;
  let num_ = 0, den = 0; rec.forEach(p=>{ num_ += (p.t-mx)*(p.v-my); den += (p.t-mx)**2; });
  return den ? num_/den*7*864e5 : null;
}
function linhaMeta(nome, unid, pts, alvo){
  if(alvo==null) return '';
  if(!pts.length) return `<div class="meta-l"><div class="meta-h"><b>${nome}</b><small>meta ${fmtN(alvo,1)} ${unid}</small></div><p class="note" style="margin:4px 0 0">Registre ${nome.toLowerCase()} para acompanhar.</p></div>`;
  const ini = pts[0].v, atual = pts[pts.length-1].v, falta = r2(atual - alvo);
  const pct = ini===alvo ? 100 : Math.max(0, Math.min(100, Math.round((ini-atual)/(ini-alvo)*100)));
  const ritmo = ritmoSemanal(pts);
  let txt = Math.abs(falta) < 0.05 ? '🎯 Meta atingida!' : `Faltam <b>${fmtN(Math.abs(falta),1)} ${unid}</b>`;
  if(Math.abs(falta) >= 0.05 && ritmo){
    const certo = (falta>0 && ritmo<0) || (falta<0 && ritmo>0);
    if(certo){ const sem = Math.abs(falta/ritmo); const dt = new Date(Date.now()+sem*7*864e5);
      txt += ` · ritmo ${signed(r2(ritmo),unid)}/semana · previsão ${dt.toLocaleDateString('pt-BR',{month:'short',year:'numeric'}).replace('.','')}`;
      if(METAS.data){ const ate = new Date(METAS.data+'T12:00').getTime(); txt += dt.getTime() <= ate ? ' ✅ dentro do prazo' : ' ⚠ depois do prazo'; } }
    else txt += ` · nas últimas semanas foi para o lado contrário (${signed(r2(ritmo),unid)}/semana)`;
  }
  return `<div class="meta-l"><div class="meta-h"><b>${nome}</b><small>${fmtN(ini,1)} → <b>${fmtN(atual,1)}</b> → meta ${fmtN(alvo,1)} ${unid}</small></div>
    <span class="bar"><i style="width:${pct}%"></i></span><p class="note" style="margin:6px 0 0">${txt}</p></div>`;
}
function cardMetas(){
  const tem = METAS.peso!=null || METAS.gordura!=null;
  return `<section class="card" style="margin-bottom:12px"><div class="card-h"><h2 class="h2">🎯 Metas</h2><button class="link" data-a="metas">${tem?'Editar':'Definir'}</button></div>
    ${tem ? linhaMeta('Peso', 'kg', serieMedida('peso'), METAS.peso) + linhaMeta('% de gordura', '%', serieMedida('gordura'), METAS.gordura)
      + (METAS.data?`<p class="note">Prazo: ${esc(fmtDay(METAS.data))}</p>`:'')
      : '<p class="note" style="margin:0">Defina o peso e o % de gordura que quer atingir. O app mostra quanto falta, o seu ritmo e a previsão.</p>'}</section>`;
}
function metasSheet(){
  openSheet(`<h2>Suas metas</h2><p>Deixe em branco o que não quiser acompanhar.</p>
    <div class="fgrid cd"><label><span>Peso (kg)</span><input class="inp" id="mt-peso" inputmode="decimal" value="${METAS.peso!=null?esc(fmtN(METAS.peso,1)):''}" placeholder="ex.: 80"></label>
      <label><span>% de gordura</span><input class="inp" id="mt-gord" inputmode="decimal" value="${METAS.gordura!=null?esc(fmtN(METAS.gordura,1)):''}" placeholder="ex.: 12"></label>
      <label style="grid-column:1/-1"><span>Prazo (opcional)</span><input class="inp" id="mt-data" type="date" value="${esc(METAS.data||'')}"></label></div>
    <div class="btns" style="margin-top:12px"><button class="btn primary" data-a="metas-save">Salvar metas</button><button class="btn ghost" data-a="close">Cancelar</button></div>`);
}
async function salvarMetas(btn){
  const peso = num($('#mt-peso').value), gord = num($('#mt-gord').value), data = $('#mt-data').value || null;
  if(peso!=null && !(peso>=30 && peso<=300)){ toast('Peso da meta entre 30 e 300 kg.', true); return; }
  if(gord!=null && !(gord>=3 && gord<=60)){ toast('% de gordura da meta entre 3 e 60.', true); return; }
  btn.disabled = true;
  try{ await D.salvarPerfil(UID, { meta_peso: peso, meta_gordura: gord, meta_data: data }); METAS = { peso, gordura: gord, data }; closeSheet(true); render(); toast('Metas salvas.'); }
  catch(e){ btn.disabled = false; toast('Não consegui salvar agora.', true); }
}

/* ----- Instalar o app ----- */
let pedidoInstalar = null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); pedidoInstalar = e; if(S.view==='hoje') render(); });
window.addEventListener('appinstalled', ()=>{ LS.set('mt.instalado', true); if(UID) render(); });
function estaInstalado(){ try{ return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true || LS.get('mt.instalado', false); }catch(e){ return false; } }
function cardInstalar(){
  if(estaInstalado() || LS.get('mt.instalar.ate', 0) > Date.now()) return '';
  return `<div class="aviso n-info inst" role="status"><span class="av-i" aria-hidden="true">📲</span><p><b>Instale o app na tela inicial.</b> Abre em tela cheia, mais rápido, e funciona sem internet.<br><button class="btn sm primary" data-a="instalar" style="margin-top:8px;width:auto">Instalar</button></p><button class="x" data-a="instalar-x" aria-label="Agora não">×</button></div>`;
}
async function instalarApp(){
  if(pedidoInstalar){ try{ pedidoInstalar.prompt(); const r = await pedidoInstalar.userChoice; if(r && r.outcome==='accepted') LS.set('mt.instalado', true); }catch(e){} pedidoInstalar = null; render(); return; }
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  openSheet(`<h2>Instalar o app</h2>${ios
    ? `<ol class="passos"><li>Abra este endereço no <b>Safari</b>.</li><li>Toque em <b>Compartilhar</b> (o quadrado com a seta para cima).</li><li>Role e toque em <b>Adicionar à Tela de Início</b>.</li><li>Toque em <b>Adicionar</b>.</li></ol>`
    : `<ol class="passos"><li>Abra este endereço no <b>Chrome</b>.</li><li>Toque no menu <b>⋮</b> no canto de cima.</li><li>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li><li>Confirme em <b>Instalar</b>.</li></ol>`}
    <p class="note">Depois é só abrir pelo ícone "Meus Treinos" na tela inicial.</p>
    <div class="btns" style="margin-top:12px"><button class="btn ghost" data-a="close">Entendi</button></div>`);
}

/* ----- Biblioteca de exercícios ----- */
function bibliotecaSheet(){
  openSheet(`<h2>Biblioteca de exercícios</h2><p>${CATALOGO.length} vídeos de execução. Os exercícios das fichas usam esta biblioteca automaticamente.</p>
    <input class="inp" id="bib-q" type="search" autocomplete="off" placeholder="Buscar: supino, rosca, agachamento…" aria-label="Buscar exercício">
    <div class="seg bib-g" id="bib-g" role="tablist">${[['','Todos'],['m','Musculação'],['c','Core'],['o','Outros']].map(([k,l])=>`<button role="tab" aria-selected="${(S.bibG||'m')===k}" data-a="bib-g" data-g="${k}">${l}</button>`).join('')}</div>
    <div class="blib" id="bib-res"></div>
    <div class="btns" style="margin-top:12px"><button class="btn ghost" data-a="close">Fechar</button></div>`);
  filtrarBiblioteca();
}
function filtrarBiblioteca(){
  const box = $('#bib-res'); if(!box) return;
  const q = ($('#bib-q') && $('#bib-q').value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const g = S.bibG==null ? 'm' : S.bibG;
  const okG = m => g==='' || (g==='m' ? (m>=14 && m<=19) : g==='c' ? m===10 : (m<10 || m===11 || m===12 || m===13));
  const termos = q.split(/\s+/).filter(Boolean);
  const res = CATALOGO.filter(c=>okG(c.modulo) && termos.every(t=>c.titulo.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(t)));
  let html = '', grupo = null;
  res.slice(0, 120).forEach(c=>{
    if(c.modulo!==grupo){ grupo = c.modulo; html += `<h3 class="h3">${esc(GRUPOS[c.modulo]||'')}</h3>`; }
    html += `<a class="bib-i" href="https://www.youtube.com/watch?v=${esc(c.youtube)}" data-video="1" data-t="${esc(c.titulo)}" target="_blank" rel="noopener noreferrer"><span>${esc(c.titulo)}</span><span class="pl" aria-hidden="true">${ICON.play}</span></a>`;
  });
  box.innerHTML = html || '<p class="note">Nenhum exercício encontrado.</p>';
  if(res.length>120) box.insertAdjacentHTML('beforeend', `<p class="note">Mostrando 120 de ${res.length}. Refine a busca.</p>`);
}

/* ----- Avisos do admin (tela Hoje) ----- */
const kAvisosVistos = ()=>'mt.avisos.'+UID;
const AV_ICO = { info:'📣', alerta:'⚠️', festa:'🎉' };
function avisosHoje(){
  const vistos = new Set(LS.get(kAvisosVistos(), []));
  const agora = Date.now();
  return AVISOS.filter(a=>a.ativo && (!a.expira || a.expira>agora) && !vistos.has(a.id)).slice(0,3).map(a=>
    `<div class="aviso n-${esc(a.nivel)}" role="status"><span class="av-i" aria-hidden="true">${AV_ICO[a.nivel]||'📣'}</span><p>${esc(a.texto)}</p><button class="x" data-a="aviso-x" data-id="${esc(a.id)}" aria-label="Fechar aviso">×</button></div>`).join('');
}

/* ----- Registro de erros (para o admin ver se está tudo funcionando) ----- */
const errosEnviados = new Set();
function registrarErro(msg, detalhe){
  if(!UID || !D.configurado) return;
  msg = String(msg||'Erro').slice(0,500);
  if(/ResizeObserver|Script error\.?$|Load failed|Failed to fetch|NetworkError|AbortError/i.test(msg)) return;
  if(errosEnviados.has(msg) || errosEnviados.size>=10) return;
  errosEnviados.add(msg);
  D.registrarErro(UID, { msg, detalhe: String(detalhe||'').slice(0,2000), tela: String(S.view||'').slice(0,60), versao: VERSAO.slice(0,40), aparelho: navigator.userAgent.slice(0,300) });
}
window.addEventListener('error', e=>registrarErro(e.message, (e.error && e.error.stack) || (e.filename+':'+e.lineno)));
window.addEventListener('unhandledrejection', e=>{ const r = e.reason; registrarErro(r && r.message || String(r), r && r.stack); });

/* ----- Área do admin ----- */
function admUser(id){ return (S.adm.usuarios||[]).find(u=>u.user_id===id) || {user_id:id, nome:'', email:''}; }
async function carregarAdmin(forcar){
  if(!ADMIN || S.adm.carregando) return;
  const A = S.adm, tab = S.admTab, tarefas = [];
  if((tab==='painel' || forcar) && !A.resumo && !A.resumoErr){
    tarefas.push(D.adminResumo().then(r=>{ A.resumo = r; A.resumoErr = null; }).catch(e=>{ A.resumoErr = e.message||'falha'; }));
    tarefas.push(D.statusLeitura().then(r=>{ A.ia = r; }).catch(()=>{ A.ia = {erro:'rede'}; }));
    tarefas.push(dispositivo().then(r=>{ A.disp = r; }));
  }
  if((tab==='usuarios' || tab==='erros') && !A.usuarios && !A.usuariosErr) tarefas.push(D.adminUsuarios().then(r=>{ A.usuarios = r; }).catch(e=>{ A.usuariosErr = true; }));
  if(tab==='conteudo' && !A.avisos && !A.avisosErr) tarefas.push(D.listarAvisos().then(r=>{ A.avisos = r; }).catch(()=>{ A.avisosErr = true; }));
  if(tab==='erros' && !A.erros && !A.errosErr) tarefas.push(D.listarErros().then(r=>{ A.erros = r; }).catch(()=>{ A.errosErr = true; }));
  if(!tarefas.length) return;
  A.carregando = true;
  await Promise.all(tarefas);
  A.carregando = false;
  if(S.view==='admin') render();
}
async function dispositivo(){
  const out = { versao: VERSAO, online: navigator.onLine, pendentes: S.pending.length, rascunho: !!S.draft, sw: false, cache: 0, uso: null };
  try{ out.sw = !!(navigator.serviceWorker && navigator.serviceWorker.controller); }catch(e){}
  try{ if(window.caches){ const c = await caches.open('mt-app'); out.cache = (await c.keys()).length; } }catch(e){}
  try{ if(navigator.storage && navigator.storage.estimate){ const e = await navigator.storage.estimate(); out.uso = e.usage; } }catch(e){}
  return out;
}
function linhaSaude(estado, titulo, texto){
  return `<div class="hl-row ${estado}"><span class="hl-dot" aria-hidden="true"></span><div><b>${esc(titulo)}</b><small>${texto}</small></div><span class="hl-tag">${estado==='ok'?'OK':estado==='warn'?'Atenção':estado==='err'?'Problema':'…'}</span></div>`;
}
function vAdmin(){
  const tabs = [['painel','Painel'],['usuarios','Usuários'],['conteudo','Conteúdo'],['erros','Erros']].map(([t,l])=>
    `<button role="tab" aria-selected="${S.admTab===t}" data-a="adm-tab" data-t="${t}">${l}</button>`).join('');
  const corpo = S.admTab==='usuarios' ? admUsuarios() : S.admTab==='conteudo' ? admConteudo() : S.admTab==='erros' ? admErros() : admPainel();
  setTimeout(()=>carregarAdmin(), 0);
  return `<button class="back" data-a="go" data-v="hoje">${ICON.back} Voltar ao app</button>
    <header class="top" style="margin-top:4px"><h1 class="h1">${ICON.shield} Admin</h1><span class="top-r">${statusPill()}</span></header>
    <div class="seg four" role="tablist" aria-label="Seções do admin">${tabs}</div>${corpo}`;
}
function carregandoAdm(){ return '<div class="center-mini"><div class="spin" aria-hidden="true"></div></div>'; }
function admPainel(){
  const A = S.adm, r = A.resumo, ia = A.ia, dp = A.disp;
  if(!r && !A.resumoErr) return carregandoAdm();
  const linhas = [];
  linhas.push(A.resumoErr ? linhaSaude('err', 'Servidor e banco de dados', 'Não respondeu. Confira a internet ou o painel do Supabase.')
    : linhaSaude(r.ms>2500?'warn':'ok', 'Servidor e banco de dados', `Respondeu em ${r.ms} ms.`));
  if(r) linhas.push(linhaSaude('ok', 'Login e contas', `${r.usuarios} ${r.usuarios===1?'conta':'contas'} · ${r.ativos_7d} ${r.ativos_7d===1?'pessoa treinou':'pessoas treinaram'} nos últimos 7 dias.`));
  if(ia){
    if(ia.erro) linhas.push(linhaSaude('warn', 'Leitura de fichas e avaliações', 'Não consegui verificar agora ('+esc(ia.erro)+').'));
    else if(!ia.chave) linhas.push(linhaSaude('err', 'Leitura de fichas e avaliações', 'Desligada: falta a chave <b>ANTHROPIC_API_KEY</b> em Supabase › Edge Functions › Secrets. Sem ela, mandar foto ou PDF não funciona.'));
    else if(!ia.valida) linhas.push(linhaSaude('err', 'Leitura de fichas e avaliações', 'A chave foi recusada (código '+esc(ia.http)+'). Gere uma chave nova no console da Anthropic e troque o secret.'));
    else linhas.push(linhaSaude('ok', 'Leitura de fichas e avaliações', 'Funcionando · modelo '+esc(ia.modelo)+'.'));
  }
  if(r){
    const pct = r.fotos_mb/1024*100;
    linhas.push(linhaSaude(pct>80?'warn':'ok', 'Armazenamento de fotos', `${r.fotos} ${r.fotos===1?'arquivo':'arquivos'} · ${fmtN(r.fotos_mb,1)} MB de 1 GB do plano grátis.`));
    linhas.push(linhaSaude(r.erros_24h>0?'warn':'ok', 'Erros no app', r.erros_24h>0 ? `${r.erros_24h} nas últimas 24 h (${r.erros_7d} em 7 dias). <button class="link" data-a="adm-tab" data-t="erros">Ver erros</button>` : `Nenhum nas últimas 24 h${r.erros_7d?' ('+r.erros_7d+' em 7 dias)':''}.`));
  }
  if(dp) linhas.push(linhaSaude(dp.sw ? (dp.pendentes ? 'warn':'ok') : 'warn', 'Este aparelho',
    `Versão ${esc(dp.versao)} · ${dp.online?'online':'sem internet'} · ${dp.sw ? 'pronto para usar offline ('+dp.cache+' arquivos guardados)' : 'modo offline ainda não ativado (abra o app de novo)'}${dp.pendentes ? ' · <b>'+dp.pendentes+' treino(s) esperando envio</b>' : ''}${dp.uso!=null ? ' · '+fmtN(dp.uso/1048576,1)+' MB usados' : ''}.`));
  const n = r ? `<div class="kgrid">
      ${[['Contas',r.usuarios],['Ativos 7 dias',r.ativos_7d],['Treinos 7 dias',r.treinos_7d],['Treinos 30 dias',r.treinos_30d],['Treinos no total',r.treinos],['Fichas',r.fichas],['Avaliações',r.avaliacoes],['Grupos',r.grupos],['Vídeos',r.videos]]
        .map(([k,v])=>`<div class="tile"><div class="k">${k}</div><div class="v">${fmtInt(v)}</div></div>`).join('')}</div>` : '';
  return `<section class="card"><div class="card-h"><h2 class="h2">Saúde do sistema</h2><button class="link" data-a="adm-check">Verificar de novo</button></div>${linhas.join('')}
      ${r?`<p class="note">Verificado às ${hhmm(Date.parse(r.agora))}.</p>`:''}</section>
    ${n?`<h2 class="h2" style="margin:18px 2px 10px">Números</h2>${n}`:''}
    <section class="card" style="margin-top:14px"><h2 class="h2">Atalhos</h2>
      <div class="btns">
        <a class="btn" href="https://supabase.com/dashboard/project/fiewzckxrqaprybzynoc" target="_blank" rel="noopener">Painel do Supabase (banco e contas)</a>
        <a class="btn" href="https://supabase.com/dashboard/project/fiewzckxrqaprybzynoc/functions/secrets" target="_blank" rel="noopener">Secrets das Edge Functions</a>
        <a class="btn" href="https://vercel.com/dashboard" target="_blank" rel="noopener">Painel da Vercel (publicação)</a>
      </div></section>`;
}
function admUsuarios(){
  const U = S.adm.usuarios;
  if(!U) return S.adm.usuariosErr ? '<div class="empty"><b>Não consegui carregar</b>Confira a internet e toque em Usuários de novo.</div>' : carregandoAdm();
  const dt = ts=>ts ? fmtDate(Date.parse(ts)) : '—';
  return `<p class="note" style="margin:0 2px 12px">Você vê dados de uso e as fichas. Peso, medidas e fotos de cada pessoa continuam privados.</p>` + U.map(u=>{
    const ult = u.ultimo_treino ? agoTxt(Date.parse(u.ultimo_treino)) : 'nunca';
    return `<section class="card ucard">
      <div class="uc-h">${miniAvatar(u.avatar_path, u.nome||u.email, 'md')}<div><b>${esc(u.nome||'Sem nome')}${u.user_id===UID?' (você)':''}</b>${arroba(u.instagram)}<small>${esc(u.email||'')}</small></div>
        ${u.admin?'<span class="chip ok">Admin</span>':''}${!u.confirmado?'<span class="chip warn">E-mail não confirmado</span>':''}</div>
      <div class="uc-g">
        <span><small>Treinos</small><b>${fmtInt(u.treinos)}</b></span><span><small>30 dias</small><b>${fmtInt(u.treinos_30d)}</b></span>
        <span><small>Último treino</small><b>${esc(ult)}</b></span><span><small>Último login</small><b>${esc(u.ultimo_login ? agoTxt(Date.parse(u.ultimo_login)) : 'nunca')}</b></span></div>
      <p class="note" style="margin-top:8px">Ficha: <b>${esc(u.ficha||'nenhuma')}</b> · Grupo: <b>${esc(u.grupo||'nenhum')}</b> · Conta criada em ${esc(dt(u.criado_em))}</p>
      <div class="btns two" style="margin-top:10px"><button class="btn sm" data-a="adm-fichas" data-id="${esc(u.user_id)}">${ICON.edit} Fichas</button>
        <button class="btn sm ghost" data-a="adm-senha" data-u="${esc(u.user_id)}">Link de nova senha</button></div>
    </section>`;
  }).join('') + `<p class="note">Para alguém novo entrar, a pessoa cria a conta no próprio app. Para apagar uma conta, use o painel do Supabase › Authentication.</p>`;
}
async function admFichasSheet(uid){
  const u = admUser(uid), nome = u.nome || u.email;
  openSheet(`<h2>Fichas de ${esc(nome)}</h2>${carregandoAdm()}`);
  let F;
  try{ F = await D.adminFichas(uid); (S.adm.fichas = S.adm.fichas || {})[uid] = F; }
  catch(e){ openSheet(`<h2>Fichas de ${esc(nome)}</h2><p>Não consegui carregar agora.</p><div class="btns"><button class="btn ghost" data-a="close">Fechar</button></div>`); return; }
  const rows = F.slice().reverse().map(f=>`<div class="frow-f${f.ativa?' on':''}"><span><b>${esc(f.nome)}</b><small>${(f.order||[]).length} treinos${f.ativa?' · em uso':''}</small></span>
    <span class="ff-b"><button class="btn sm" data-a="adm-f-edit" data-u="${esc(uid)}" data-id="${esc(f.id)}">Editar</button>${f.ativa?'':`<button class="btn sm ghost" data-a="adm-f-usar" data-u="${esc(uid)}" data-id="${esc(f.id)}">Usar</button>`}</span></div>`).join('');
  openSheet(`<h2>Fichas de ${esc(nome)}</h2><p>O que você salvar aqui aparece para ${esc(nome)} na próxima vez que abrir o app.</p>
    ${rows ? `<div class="flist">${rows}</div>` : '<p class="note">Ainda não tem ficha.</p>'}
    <h3 class="h3">Criar ficha nova para ${esc(nome)}</h3>
    <div class="btns"><button class="btn" data-a="adm-f-foto" data-u="${esc(uid)}">${ICON.doc} Ler foto ou PDF da ficha do personal</button>
      <button class="btn" data-a="adm-f-modelo" data-u="${esc(uid)}">Começar pela ficha modelo A–E</button>
      <button class="btn ghost" data-a="close">Fechar</button></div>`);
}
function admEditarFicha(uid, id){
  const f = ((S.adm.fichas||{})[uid]||[]).find(x=>x.id===id); if(!f) return;
  const u = admUser(uid);
  closeSheet(true);
  abrirEditor({ id:f.id, nome:f.nome, order:f.order.slice(), w:copia(f.w), sched:Object.assign({}, f.sched), dono:{id:uid, nome:u.nome||u.email} }, 'admin');
}
function admConteudo(){
  const A = S.adm, Av = A.avisos;
  const lista = !Av ? (A.avisosErr ? '<p class="note">Não consegui carregar os avisos.</p>' : carregandoAdm())
    : Av.length ? Av.map(a=>{ const vencido = a.expira && a.expira<Date.now(); const st = !a.ativo ? 'Pausado' : vencido ? 'Expirado' : 'No ar';
        return `<div class="avrow${a.ativo&&!vencido?' on':''}"><span class="av-i" aria-hidden="true">${AV_ICO[a.nivel]||'📣'}</span><div><p>${esc(a.texto)}</p>
          <small>${st} · criado ${esc(fmtDate(a.t))}${a.expira?' · até '+esc(fmtDate(a.expira)):''}</small></div>
          <span class="avrow-b"><button class="mini" data-a="adm-aviso-on" data-id="${esc(a.id)}" data-v="${a.ativo?'0':'1'}">${a.ativo?'Pausar':'Ativar'}</button><button class="mini del wide" data-a="adm-aviso-del" data-id="${esc(a.id)}" aria-label="Apagar aviso">×</button></span></div>`; }).join('')
    : '<p class="note">Nenhum aviso ainda.</p>';
  const nv = Object.keys(VIDEOS).length;
  return `<section class="card"><h2 class="h2">Aviso para todos</h2>
      <p class="note" style="margin-top:0">Aparece no topo da tela Hoje de todo mundo. Cada pessoa pode fechar o seu.</p>
      <textarea class="notes" id="av-txt" maxlength="400" placeholder="Ex.: Academia fechada no feriado de sexta. Treino D fica para sábado."></textarea>
      <div class="frow2 lem" style="margin-top:10px"><label class="lbl-in"><span>Tipo</span><select class="inp" id="av-nivel"><option value="info">📣 Informação</option><option value="alerta">⚠️ Alerta</option><option value="festa">🎉 Comemoração</option></select></label>
        <label class="lbl-in"><span>Fica no ar</span><select class="inp" id="av-dias"><option value="1">1 dia</option><option value="7" selected>7 dias</option><option value="30">30 dias</option><option value="0">Até eu tirar</option></select></label></div>
      <label class="nt-ck" style="margin-top:10px"><input type="checkbox" id="av-push" checked> <span>Enviar também como notificação no celular</span></label>
      <p class="note" style="margin-top:4px">Chega para todos que ativaram as notificações, inclusive você.</p>
      <button class="btn primary" data-a="adm-aviso" style="margin-top:12px">Publicar aviso</button>
      <h3 class="h3">Avisos</h3>${lista}</section>
    <section class="card" style="margin-top:12px"><h2 class="h2">Vídeos dos exercícios</h2>
      <p class="note" style="margin-top:0">${nv} ${nv===1?'exercício tem':'exercícios têm'} vídeo. Os links valem para todos.</p>
      <button class="btn" data-a="videos" style="margin-top:10px">${ICON.play} Editar vídeos</button></section>`;
}
async function publicarAviso(btn){
  const texto = ($('#av-txt').value||'').trim();
  if(!texto){ toast('Escreva o aviso.', true); return; }
  const dias = +$('#av-dias').value;
  btn.disabled = true;
  try{
    const push = !!($('#av-push')||{}).checked;
    const a = await D.criarAviso({ texto, nivel: $('#av-nivel').value, expira: dias ? Date.now()+dias*864e5 : null, notificar: push });
    AVISOS = [a].concat(AVISOS); S.adm.avisos = [a].concat(S.adm.avisos||[]);
    render(); toast(push ? 'Aviso publicado e enviado como notificação.' : 'Aviso publicado para todos.');
  }catch(e){ btn.disabled = false; toast('Não consegui publicar agora.', true); }
}
function admErros(){
  const E = S.adm.erros;
  if(!E) return S.adm.errosErr ? '<div class="empty"><b>Não consegui carregar</b>Confira a internet.</div>' : carregandoAdm();
  if(!E.length) return `<div class="empty"><b>Nenhum erro registrado</b>Quando algo der errado no celular de alguém, aparece aqui com a tela, a versão e o aparelho.</div>`;
  const nomes = {}; (S.adm.usuarios||[]).forEach(u=>{ nomes[u.user_id] = (u.nome || u.email)+(u.instagram?' @'+u.instagram:''); });
  const ap = ua=>{ ua = ua||''; return /iPhone|iPad/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Computador' : 'Outro'; };
  return `<div class="btns" style="margin-bottom:12px"><button class="btn sm danger" data-a="adm-erros-limpar">Limpar todos os erros</button></div>` + E.map(e=>`<details class="erro"><summary>
      <b>${esc(e.msg)}</b><small>${esc(fmtDate(Date.parse(e.created_at)))} ${hhmm(Date.parse(e.created_at))} · ${esc(nomes[e.user_id]||'alguém')} · tela ${esc(e.tela||'?')} · ${ap(e.aparelho)}</small></summary>
      <pre>${esc((e.detalhe||'sem detalhes'))}\n\nVersão: ${esc(e.versao||'?')}\n${esc(e.aparelho||'')}</pre></details>`).join('');
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
      <span><b>${esc(W.name)}</b><small>${esc(W.focus)}</small><small>${W.ex.length} exercícios · ${W.total} séries</small><small class="exec">${linhaExecucoes(L)}</small>${naSemana?`<span class="chip ok wk">✓ Feito nesta semana</span>`:''}</span>
      <span class="chev" aria-hidden="true">${naSemana?`<span class="ck big">${ICON.check}</span>`:'›'}</span></button>`;
  }).join('');
  return `<header class="top"><h1 class="h1">Treinos</h1><span class="top-r">${statusPill()}${avatarBtn()}</span></header>
    <section class="card"><div class="card-h"><h2 class="h2">${esc(FICHA.nome)}</h2><button class="link" data-a="f-edit">${ICON.edit} Editar</button></div>
    <ol class="sched-list">${rows}</ol>
    <p class="note">Se precisar trocar de treino num dia, o que ficou para trás é sugerido no próximo.${semanasDaFicha()!=null?` Ficha em uso há <b>${semanasDaFicha()} ${semanasDaFicha()===1?'semana':'semanas'}</b>.`:''}</p></section>
    <div class="wlist">${cards}</div>
    <div class="btns two" style="margin-top:14px"><button class="btn sm ghost" data-a="fichas">Trocar de ficha</button><button class="btn sm ghost" data-a="go" data-v="onboarding">+ Nova ficha</button></div>
    ${CATALOGO.length?`<button class="gcta" data-a="biblioteca" style="margin-top:12px"><span class="ci">${ICON.play}</span><span><b>Biblioteca de exercícios</b><small>${CATALOGO.length} vídeos de execução para consultar</small></span><span class="chev" aria-hidden="true">›</span></button>`:''}`;
}
function vTreino(L){
  const W = FICHA && FICHA.W[L]; if(!W) return vTreinos();
  const ex = W.ex.map((e,i)=>{
    const sug = suggest(e, 0, L, FICHA.id);
    return `<article class="ex"><div class="ex-h"><span class="ex-num">${pad(i+1)}</span><div>
      <h3>${esc(e.n)}</h3><div class="chips"><span class="chip">${e.s} × ${range(e.r)}</span><span class="chip">Descanso ${restTxt(e.rest)}</span>${chipsTecnica(e)}</div></div></div>
      ${e.tip?`<p class="tip"><b>Dica:</b> ${esc(e.tip)}</p>`:''}${videoLink(e)}
      ${sug ? `<p class="last">Última vez (${fmtDate(sug.le.s.start)}): ${lastSummary(sug.le.e, e)}</p>${sugBlock(sug, e)}` : ''}${avisoEstagnado(e)}
      <div style="height:6px"></div></article>`;
  }).join('');
  return `<button class="back" data-a="go" data-v="treinos">${ICON.back} Treinos</button>
    <div class="whead"><span class="big-letter neon" aria-hidden="true">${L}</span>
      <div><div class="hero-name">${esc(W.name)}</div><div class="hero-focus">${esc(W.focus)}</div>
      ${W.rest?`<div class="meta">Descanso geral ${esc(W.rest)}</div>`:''}<div class="meta exec">${linhaExecucoes(L)}</div></div></div>
    <div class="btns" style="margin-top:14px"><button class="btn primary" data-a="start" data-l="${L}">${S.draft&&S.draft.letter===L?'Continuar':'Começar'} treino ${L}</button></div>
    ${blocoAquecimento(W)}
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
    <div id="vivo-bar">${vivoBarra()}</div>
    ${blocoAquecimento(d.w)}
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
      <div class="chips"><span class="chip">${e.s} × ${range(e.r)}</span><span class="chip">${restTxt(e.rest)}</span>${chipsTecnica(e)}<span class="chip ok" id="ex-ok-${i}"${complete?'':' hidden'}>Concluído</span></div>
    </div><button class="swapbtn" data-a="swap" data-ei="${i}" aria-label="Trocar ${esc(e.n)} por outro exercício">${ICON.swap}<span>Trocar</span></button></div>
    ${e.orig?`<p class="swapped">Substituído hoje (era <b>${esc(e.orig.n)}</b>) <button class="link" data-a="swap-undo" data-ei="${i}">Voltar ao original</button></p>`:''}
    ${e.tip?`<p class="tip"><b>Dica:</b> ${esc(e.tip)}</p>`:''}${videoLink(e)}
    <div class="vivo-exl" id="vivo-ex-${i}">${vivoDoEx(e)}</div>
    ${sug ? `<p class="last">Última vez (${fmtDate(sug.le.s.start)}): ${lastSummary(sug.le.e, e)}</p>${sugBlock(sug, e)}` : ''}${avisoEstagnado(e)}
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
    + (S.sessions.length ? `<div class="btns two" style="margin-bottom:8px"><button class="btn sm" data-a="share" data-t="semana">${ICON.share} Semana</button><button class="btn sm" data-a="share" data-t="mes">${ICON.share} Mês</button></div>
      <button class="btn sm retro-b" data-a="share-retro" style="margin-bottom:14px">🎉 Retrospectiva ${anoRetro()}</button>` : '');
  if(!S.sessions.length) return head+`<div class="empty"><b>Nenhum treino salvo ainda</b>Quando você finalizar um treino, ele aparece aqui com data, duração, séries e volume.</div>`;
  let html='', month='';
  S.sessions.forEach(s=>{
    const m = new Date(s.start).toLocaleDateString('pt-BR',{month:'long', year:'numeric'});
    if(m!==month){ month=m; html += `<h2 class="hist-month">${esc(m)}</h2>`; }
    const pend = S.pending.some(p=>p.id===s.id);
    html += `<button class="hrow" data-a="hist" data-id="${esc(s.id)}">
      <span class="hl neon${ehCardio(s)?' cd':''}" aria-hidden="true">${esc(letraCurta(s))}</span>
      <span><b>${esc(fmtDate(s.start))} · ${esc(ehAula(s)?'Aula · '+s.wname:ehCardio(s)?'Cardio · '+s.wname:s.wname)}</b><small>${mins(s.dur)} min${ehCardio(s) ? (dadosCardio(s).intens?' · '+dadosCardio(s).intens:'')+(dadosCardio(s).km?' · '+fmtN(dadosCardio(s).km,2)+' km':'') : ' · '+s.done+'/'+s.total+' séries'}${pend?' · esperando conexão':''}</small></span>
      ${ehCardio(s) ? `<span class="hv">${dadosCardio(s).kcal?(dadosCardio(s).kcalEst?'~':'')+fmtInt(dadosCardio(s).kcal)+'<small> kcal</small>':mins(s.dur)+'<small> min</small>'}<small>${ehAula(s)?'aula':'cardio'}</small></span>` : `<span class="hv">${fmtInt(s.vol)}<small> kg</small><small>volume</small></span>`}</button>`;
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
  const C = minhasConquistas(), nv = nivel(pontos()), sem = semanasAtivas(S.sessions.map(s=>chaveDia(s.start)));
  const feitas = C.filter(c=>c.at).sort((a,b)=>b.at-a.at), falta = C.filter(c=>!c.at).sort((a,b)=>(b.prog[0]/b.prog[1])-(a.prog[0]/a.prog[1]));
  const prog = c=> c.tipo==='vol' ? fmtN(c.prog[0]/1000,1)+' de '+fmtN(c.prog[1]/1000,0)+' t' : c.prog[0]+' de '+c.prog[1];
  const badge = c=>`<${c.at?`button data-a="share-cq" data-id="${esc(c.id)}"`:'div'} class="badge${c.at?' on':''}"><span class="b-ico" aria-hidden="true">${c.ico}</span><b>${esc(c.nome)}</b>
    <small>${c.at ? 'Conquistado em '+shortDay(chaveDia(c.at)) : esc(c.desc)}</small>
    ${!c.at && c.prog[1]>1 ? `<span class="bar sm" aria-hidden="true"><i style="width:${Math.round(c.prog[0]/c.prog[1]*100)}%"></i></span><small class="pg">${prog(c)}</small>` : ''}${c.at?`<span class="b-sh">${ICON.share} Compartilhar</span>`:''}</${c.at?'button':'div'}>`;
  const degraus = NIVEIS.map(([n,nome],i)=>`<span class="step${i<=nv.i?' on':''}${i===nv.i?' cur':''}"><b>${esc(nome)}</b><small>${n}</small></span>`).join('');
  return `<section class="card lvlcard">
      <div class="lvl-big"><span class="lv-n" aria-hidden="true">${nv.i+1}</span><div><small>Nível</small><b>${esc(nv.nome)}</b></div>
        <span class="lvl-fire${sem?'':' off'}"><span aria-hidden="true">🔥</span><b>${sem}</b><small>${sem===1?'semana ativa':'semanas ativas'}</small></span></div>
      <span class="bar"><i style="width:${Math.round(nv.pct*100)}%"></i></span>
      <p class="note">${nv.prox ? `${nv.n} ${nv.n===1?'ponto':'pontos'} · faltam <b>${nv.prox.n-nv.n}</b> para o nível <b>${esc(nv.prox.nome)}</b>` : `${nv.n} pontos · nível máximo!`}</p>
      <div class="steps" aria-label="Níveis por pontos">${degraus}</div>
      <p class="note">Cada treino vale 1 ponto e cada missão da semana cumprida vale mais 1. Semana ativa = 3 ou mais dias de treino.</p>
      <button class="btn sm" data-a="temas" style="margin-top:10px">🎨 Temas do app</button>
      ${nv.i>0?`<button class="btn sm" data-a="share-nv" style="margin-top:12px">${ICON.share} Compartilhar meu nível</button>`:''}</section>
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
  return `${blocoEstagnados()}<section class="card"><h2 class="h2">Cargas por exercício</h2>${exBlock}</section>
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
  return `${cardMetas()}<section class="card"><h2 class="h2">Medidas e composição</h2>${mBlock}</section>
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
        <input type="range" id="cmp-range" min="0" max="100" value="50" aria-label="Deslize para comparar">
        <button class="btn" data-a="share-ad" style="margin-top:12px">${ICON.share} Gerar story antes e depois</button>`
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
    // contagem regressiva: 3 toques curtos antes do fim, depois o sinal de "pode ir"
    [[-3,520,0.09],[-2,520,0.09],[-1,620,0.09]].forEach(([o,f,d])=>{
      if(sec + o < 0.3) return;
      const osc = AC.createOscillator(), g = AC.createGain();
      osc.type='sine'; osc.frequency.value=f;
      g.gain.setValueAtTime(0.0001, t0+o); g.gain.exponentialRampToValueAtTime(0.18, t0+o+0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0+o+d);
      osc.connect(g); g.connect(AC.destination); osc.start(t0+o); osc.stop(t0+o+d+0.02); beeps.push(osc);
    });
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
    { const arc = $('#rest-arc'); if(arc) arc.style.strokeDashoffset = '100'; }
    el.classList.remove('final');
    return;
  }
  $('#rest-lbl').textContent = r.label;
  const seg = Math.ceil(left);
  $('#rest-time').textContent = clock(seg);
  $('#rest-fill').style.width = (left/r.total*100)+'%';
  const arc = $('#rest-arc'); if(arc) arc.style.strokeDashoffset = String(100 - left/r.total*100);
  // últimos 3 segundos: número pulsando e vibração curta a cada segundo
  const fim = seg <= 3;
  el.classList.toggle('final', fim);
  if(fim && r.ult !== seg){ r.ult = seg; vibrar(seg===1 ? 80 : 40); const t = $('#rest-time'); t.classList.remove('pulso'); void t.offsetWidth; t.classList.add('pulso'); }
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
// Tela sempre acesa durante o treino: pede ao entrar na sessão, solta ao sair.
// O sistema solta sozinho quando o app vai para segundo plano; ao voltar, pedimos de novo.
let pedindoTela = false;
async function pedirTelaAcesa(){
  if(!navigator.wakeLock || wakeLock || pedindoTela || document.hidden) return;
  pedindoTela = true;
  try{ wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', ()=>{ wakeLock=null; }); }catch(e){}
  pedindoTela = false;
  if(S.view!=='sessao') soltarTela();
}
function soltarTela(){ if(wakeLock){ const w = wakeLock; wakeLock = null; w.release().catch(()=>{}); } }
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
    try{ checarRecorde(i, si); }catch(err){ console.error('recorde', err); }
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
  const nomes = [...new Set(Object.values(N).concat(CATALOGO.filter(c=>c.modulo>=10).map(c=>c.titulo)))].filter(n=>n && slug(n)!==e.key).sort((a,b)=>a.localeCompare(b,'pt-BR'));
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
  s.ex.forEach(e=>(e.keys||[]).forEach((k,i)=>{
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
// grava um treino ou cardio (fila local + envio) e diz o que foi conquistado
function registrarSessao(s){
  const antes = new Set(minhasConquistas().filter(c=>c.at).map(c=>c.id));
  const nv0 = nivel(S.sessions.filter(x=>x.id!==s.id).length + MISSOES.length);
  S.sessions = [s].concat(S.sessions.filter(x=>x.id!==s.id)).sort((a,b)=>b.start-a.start);
  S.pending = S.pending.filter(p=>p.id!==s.id).concat([s]); LS.set(kPending(), S.pending);
  const novas = minhasConquistas().filter(c=>c.at && !antes.has(c.id));
  const nv1 = nivel(pontos());
  const extra = (nv1.i>nv0.i ? ' Subiu para o nível '+nv1.nome+'!' : '') + (novas.length ? ' Nova conquista: '+novas.map(c=>c.ico+' '+c.nome).join(', ')+'.' : '');
  const selo = novas.length ? novas[novas.length-1] : (nv1.i>nv0.i ? conquistaNivel(nv1) : null);
  return { extra, selo };
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
  const nv0 = nivel(pontos()-1), nv1 = nivel(pontos());
  const extra = (nv1.i>nv0.i ? ' Subiu para o nível '+nv1.nome+'!' : '') + (novas.length ? ' Nova conquista: '+novas.map(c=>c.ico+' '+c.nome).join(', ')+'.' : '');
  resumoTreinoSheet(s, prs, ' Próximo: Treino '+nx+'.'+extra, novas.length ? novas[novas.length-1] : (nv1.i>nv0.i ? conquistaNivel(nv1) : null));
  verificarMissoes();
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
  if(ehCardio(s)){
    const c = dadosCardio(s);
    const aula = ehAula(s);
    openSheet(`<h2>${aula?AULAS[s.wname].ico+' Aula de '+esc(s.wname.toLowerCase()):'Cardio · '+esc(s.wname)}</h2><p style="text-transform:capitalize">${esc(fmtDate(s.start))}, ${hhmm(s.start)}</p>
      <div class="sum"><div class="tile"><div class="k">Tempo</div><div class="v">${mins(s.dur)}<small> min</small></div></div>
      ${aula && !c.km ? `<div class="tile"><div class="k">Intensidade</div><div class="v sm" style="text-transform:capitalize">${esc(c.intens||'—')}</div></div>` : `<div class="tile"><div class="k">Distância</div><div class="v">${c.km?fmtN(c.km,2)+'<small> km</small>':'—'}</div></div>`}
      <div class="tile"><div class="k">Calorias${c.kcalEst?' (est.)':''}</div><div class="v">${c.kcal?fmtInt(c.kcal):'—'}</div></div></div>
      ${s.notes?`<div class="dex"><b>Observações</b><div>${esc(s.notes)}</div></div>`:''}
      <div class="btns" style="margin-top:14px"><button class="btn primary" data-a="share" data-t="semana" data-id="${esc(s.id)}">${ICON.share} Compartilhar imagem</button>
      <button class="btn" data-a="h-edit" data-id="${esc(s.id)}">${ICON.edit} Editar</button>
      <button class="btn danger" data-a="hdel" data-id="${esc(s.id)}">Excluir</button>
      <button class="btn ghost" data-a="close">Fechar</button></div>`);
    return;
  }
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
    <div class="btns" style="margin-top:14px"><button class="btn primary" data-a="share" data-t="semana" data-id="${esc(s.id)}">${ICON.share} Compartilhar imagem</button>
    <button class="btn" data-a="h-edit" data-id="${esc(s.id)}">${ICON.edit} Corrigir cargas e repetições</button>
    <button class="btn" data-a="copy" data-id="${esc(s.id)}">Copiar resumo</button>
    <button class="btn danger" data-a="hdel" data-id="${esc(s.id)}">Excluir este treino</button>
    <button class="btn ghost" data-a="close">Fechar</button></div>`);
}
function summaryText(s){
  if(ehCardio(s)){ const c = dadosCardio(s); return 'Cardio – '+s.wname+' · '+fmtDate(s.start)+' · '+mins(s.dur)+' min'+(c.km?' · '+fmtN(c.km,2)+' km':'')+(c.kcal?' · '+fmtInt(c.kcal)+' kcal':'')+(s.notes?'\nObs.: '+s.notes:''); }
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
    render(); toast('Peso registrado: '+fmtN(kg)+' kg.'); verificarMissoes();
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
    f.aviso = 'Li '+f.order.length+' treinos da ficha. Confira nomes, séries, repetições e descansos antes de salvar.';
    if(S.admDono){ f.dono = S.admDono; S.admDono = null; }
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
      <button class="btn" data-a="notif">${ICON.bell} Notificações</button>
      <button class="btn" data-a="temas">🎨 Temas do app</button>
      ${!estaInstalado()?`<button class="btn" data-a="instalar">📲 Instalar o app na tela inicial</button>`:''}
      ${ADMIN?`<button class="btn adm" data-a="go-close" data-v="admin">${ICON.shield} Área do admin</button>`:''}
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
// ---------- antes e depois ----------
function valorPerto(dk, k, janela){
  const alvo = new Date(dk+'T12:00').getTime(); let melhor = null;
  serieMedida(k).forEach(p=>{ const dd = Math.abs(p.t-alvo); if(dd <= janela*864e5 && (!melhor || dd < melhor.dd)) melhor = { v:p.v, dd }; });
  return melhor ? melhor.v : null;
}
async function bitmapDaFoto(path){ try{ const b = await D.baixarFoto(path); return await createImageBitmap(b); }catch(e){ return null; } }
async function dadosAntesDepois(){
  const c = S.cmp, P = S.photos;
  const pa = P.find(p=>p.d===c.a && p.pose===c.pose), pb = P.find(p=>p.d===c.b && p.pose===c.pose);
  const [fotoA, fotoB] = await Promise.all([bitmapDaFoto(pa.path), bitmapDaFoto(pb.path)]);
  const kgA = valorPerto(c.a, 'peso', 10), kgB = valorPerto(c.b, 'peso', 10);
  const gA = valorPerto(c.a, 'gordura', 20), gB = valorPerto(c.b, 'gordura', 20);
  const ta = new Date(c.a+'T12:00').getTime(), tb = new Date(c.b+'T12:00').getTime();
  return { antes:{ ts:ta, kg: kgA!=null ? r2(kgA) : null }, depois:{ ts:tb, kg: kgB!=null ? r2(kgB) : null }, fotoA, fotoB,
    dias: Math.round((tb-ta)/864e5), difKg: kgA!=null && kgB!=null ? Math.round((kgB-kgA)*10)/10 : null,
    difGord: gA!=null && gB!=null ? Math.round((gB-gA)*10)/10 : null,
    treinos: S.sessions.filter(x=>x.start>=ta && x.start<=tb+864e5).length,
    pose: (POSES.find(p=>p[0]===c.pose)||['',''])[1], data: Date.now(), nome: NOME || EMAIL.split('@')[0], insta: INSTA };
}
// ---------- retrospectiva ----------
const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function dadosRetrospectiva(ano){
  const doAno = S.sessions.filter(s=>new Date(s.start).getFullYear()===ano);
  const dias = new Set(doAno.map(s=>chaveDia(s.start)));
  const seg = doAno.reduce((n,s)=>n+(s.dur||0),0), vol = doAno.reduce((n,s)=>n+(s.vol||0),0);
  // melhor sequência de semanas ativas no ano
  const porSemana = new Map(); [...dias].forEach(dk=>{ const w = startOfWeek(new Date(dk+'T12:00').getTime()); porSemana.set(w, (porSemana.get(w)||0)+1); });
  const ativas = [...porSemana.entries()].filter(([w,n])=>n>=3).map(([w])=>w).sort((a,b)=>a-b);
  let seq = 0, run = 0, ant = null;
  ativas.forEach(w=>{ run = ant!=null && Math.round((w-ant)/(7*864e5))===1 ? run+1 : 1; seq = Math.max(seq, run); ant = w; });
  // favorito, evolução e mês
  const N = nomeDeChave(), cont = {}, prim = {}, melhor = {};
  doAno.slice().sort((a,b)=>a.start-b.start).forEach(s=>(s.ex||[]).forEach(e=>(e.keys||[]).forEach((k,i)=>{
    cont[k] = (cont[k]||0)+1;
    let m = null; (e.sets||[]).forEach(st=>{ const kg = num(st.p[i]&&st.p[i].kg); if(kg>0 && (m==null||kg>m)) m = kg; });
    if(m!=null){ if(prim[k]==null) prim[k] = m; melhor[k] = Math.max(melhor[k]||0, m); }
  })));
  const fk = Object.keys(cont).sort((a,b)=>cont[b]-cont[a])[0];
  const ek = Object.keys(melhor).filter(k=>melhor[k]-prim[k]>0).sort((a,b)=>(melhor[b]-prim[b])-(melhor[a]-prim[a]))[0];
  const porMes = {}; [...dias].forEach(dk=>{ const m = +dk.slice(5,7)-1; porMes[m] = (porMes[m]||0)+1; });
  const mm = Object.keys(porMes).sort((a,b)=>porMes[b]-porMes[a])[0];
  const conq = minhasConquistas().filter(c=>c.at && new Date(c.at).getFullYear()===ano).length;
  return { ano, treinos: doAno.length, dias: dias.size, horas: fmtN(seg/3600, seg<36000?1:0), toneladas: fmtN(vol/1000, vol<10000?1:0), seq,
    favorito: fk ? { nome: N[fk]||fk, vezes: cont[fk] } : null, evolucao: ek ? { nome: N[ek]||ek, kg: r2(melhor[ek]-prim[ek]) } : null,
    mes: mm!=null ? { nome: MESES_PT[mm], dias: porMes[mm] } : null, conquistas: conq, cardio: doAno.filter(ehCardio).length,
    data: Date.now(), nome: NOME || EMAIL.split('@')[0], insta: INSTA };
}
function anoRetro(){ const d = new Date(); return d.getMonth()===0 && d.getDate()<=15 ? d.getFullYear()-1 : d.getFullYear(); }
function cardRetro(){
  const d = new Date(), ano = anoRetro();
  if(!((d.getMonth()===11 && d.getDate()>=10) || (d.getMonth()===0 && d.getDate()<=15))) return '';
  if(!S.sessions.some(s=>new Date(s.start).getFullYear()===ano) || LS.get('mt.retro.'+ano, false)) return '';
  return `<div class="aviso n-festa" role="status"><span class="av-i" aria-hidden="true">🎉</span><p><b>Sua retrospectiva ${ano} está pronta!</b> Treinos, horas, toneladas e destaques do ano.<br><button class="btn sm primary" data-a="share-retro" style="margin-top:8px;width:auto">Ver retrospectiva</button></p><button class="x" data-a="retro-x" aria-label="Fechar">×</button></div>`;
}
function conquistaNivel(nv){ return { nivel:true, ico:'⭐', nome:'Nível '+nv.nome, desc: nv.n+' treinos'+(nv.prox?' · próximo: '+nv.prox.nome+' ('+nv.prox.n+')':''), at: Date.now(), nv }; }
function dadosConquista(c){
  const C = minhasConquistas(), nv = c.nv || nivel(pontos());
  return { titulo: c.nome, desc: c.desc, ico: c.ico, nivel: !!c.nivel, nivelNum: nv.i+1, nivelNome: nv.nome, data: c.at || Date.now(),
    feitas: C.filter(x=>x.at).length, total: C.length, treinos: S.sessions.length, nome: NOME || EMAIL.split('@')[0], insta: INSTA };
}
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
  const op = [['semana','Semana'],['mes','Mês']].concat(CARD.conquista ? [['conquista', CARD.conquista.nivel ? 'Nível' : 'Conquista']] : []);
  const unico = tipo==='antesdepois' || tipo==='retro';
  const tabs = unico ? '' : `<div class="seg ${op.length===3?'tres':'two'}" role="tablist">${op.map(([k,l])=>`<button role="tab" aria-selected="${tipo===k}" data-a="share-tab" data-t="${k}">${l}</button>`).join('')}</div>`;
  const aviso = tipo==='antesdepois' ? '<p class="note" style="margin-top:0">Suas fotos aparecem na imagem. Ela só sai do app se você compartilhar ou baixar.</p>' : '';
  openSheet(`<h2>${esc(titulo || 'Compartilhar')}</h2><p>Imagem pronta para o story ou o WhatsApp.</p>${aviso}${tabs}
    <div class="cardprev" id="cardprev"><div class="spin" aria-hidden="true"></div></div>
    <div class="btns" style="margin-top:12px"><button class="btn primary" data-a="share-go" id="share-go" disabled>${ICON.share} Compartilhar</button>
    <a class="btn ghost" id="share-dl" download="treino.png" aria-disabled="true">Baixar imagem</a>
    <button class="btn ghost" data-a="close">Fechar</button></div>`);
  try{
    const foto = await fotoParaCartao();
    const canvas = tipo==='antesdepois' ? await desenharAntesDepois(Object.assign(await dadosAntesDepois(), {foto}))
      : tipo==='retro' ? await desenharRetrospectiva(Object.assign(dadosRetrospectiva(CARD.ano), {foto}))
      : tipo==='conquista' && CARD.conquista ? await desenharConquista(Object.assign(dadosConquista(CARD.conquista), {foto}))
      : tipo==='mes' ? await desenharMes(Object.assign(dadosMes(ref), {foto})) : await desenharSemana(Object.assign(dadosSemana(ref), {foto, conquista: ref && CARD.conquista ? CARD.conquista.nome : null}));
    const blob = await new Promise(r=>canvas.toBlob(r, 'image/png'));
    if(CARD.tipo!==tipo || CARD.ref!==(ref||null)) return;
    CARD.blob = blob; CARD.url = URL.createObjectURL(blob);
    const prev = $('#cardprev'); if(prev) prev.innerHTML = `<img src="${CARD.url}" alt="Imagem para compartilhar">`;
    const dl = $('#share-dl'); if(dl){ dl.href = CARD.url; dl.download = 'meus-treinos-'+tipo+'.png'; dl.removeAttribute('aria-disabled'); }
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
  const file = new File([CARD.blob], 'meus-treinos-'+CARD.tipo+'.png', {type:'image/png'});
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
    case 'start': if(!S.draft && !$('#sheet').hidden) closeSheet(true); startWorkout(t.dataset.l); break;
    case 'force-start': S.draft=null; LS.set(kDraft(), null); stopRest(); closeSheet(true); startWorkout(t.dataset.l); break;
    case 'check': toggleSet(+t.dataset.ei, +t.dataset.si); break;
    case 'addset': addSet(+t.dataset.ei); break;
    case 'tecnica': tecnicaSheet(t.dataset.t); break;
    case 'vivo': vivoSheet(); break;
    case 'notif': closeSheet(true); notifSheet(); break;
    case 'seq': closeSheet(true); seqSheet(); break;
    case 'trocar-treino': trocarTreinoSheet(); break;
    case 'missoes': closeSheet(true); missoesSheet(); break;
    case 'agua': aguaSheet(); break;
    case 'agua+': addAgua(+t.dataset.ml); break;
    case 'agua-undo': desfazerAgua(); break;
    case 'agua-meta': salvarMetaAguaSheet(); break;
    case 'temas': closeSheet(true); temasSheet(); break;
    case 'tema': escolherTema(t.dataset.t); break;
    case 'rs-share': if(S.rsCard){ const r = S.rsCard; abrirCompartilhar('semana', r.s, r.titulo, r.selo); } break;
    case 'notif-x': LS.set('mt.notif.ate', Date.now()+21*864e5); render(); break;
    case 'nt-on': ativarNotif(); break;
    case 'nt-off': desativarNotif(); break;
    case 'nt-teste': enviarTesteNotif(); break;
    case 'nt-save': salvarNotif(); break;
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
    case 'biblioteca': bibliotecaSheet(); break;
    case 'reagir': reagir(t); break;
    case 'cardio': cardioSheet(); break;
    case 'cd-tipo': { S.cdTipo = t.dataset.t; const m = LS.get('mt.cardio.min.'+S.cdTipo, null); const mi = $('#cd-min'); if(m && mi) mi.value = m; ajustarCardio(); break; }
    case 'cd-int': S.cdInt = t.dataset.k; ajustarCardio(); break;
    case 'cd-save': salvarCardio(); break;
    case 'h-edit': editarTreinoSheet(t.dataset.id); break;
    case 'he-del': { const ei=+t.dataset.ei, si=+t.dataset.si; S.editS.ex[ei].sets.splice(si,1); desenharEdicaoTreino(); break; }
    case 'he-tipo': S.editS.wname = t.dataset.t; S.editS.ex[0].n = t.dataset.t; S.editS.ex[0].parts = [t.dataset.t]; desenharEdicaoTreino(); break;
    case 'he-save': salvarEdicaoTreino(t); break;
    case 'ficha-ok': LS.set('mt.fichaaviso.'+FICHA.id, Date.now()+14*864e5); { const c = t.closest('.aviso'); if(c) c.remove(); } toast('Te lembro de novo em 2 semanas.'); break;
    case 'metas': metasSheet(); break;
    case 'metas-save': salvarMetas(t); break;
    case 'instalar': closeSheet(true); instalarApp(); break;
    case 'instalar-x': LS.set('mt.instalar.ate', Date.now()+30*864e5); { const c = t.closest('.aviso'); if(c) c.remove(); } break;
    case 'bib-g': S.bibG = t.dataset.g; document.querySelectorAll('#bib-g button').forEach(b=>b.setAttribute('aria-selected', String(b===t))); filtrarBiblioteca(); break;
    case 'aviso-x': { const vistos = LS.get(kAvisosVistos(), []); vistos.push(t.dataset.id); LS.set(kAvisosVistos(), vistos.slice(-50)); const c = t.closest('.aviso'); if(c) c.remove(); break; }
    case 'adm-tab': S.admTab = t.dataset.t; ['usuariosErr','avisosErr','errosErr'].forEach(k=>{ S.adm[k] = false; }); render(); break;
    case 'adm-check': S.adm = {}; render(); carregarAdmin(true); break;
    case 'adm-fichas': admFichasSheet(t.dataset.id); break;
    case 'adm-f-edit': admEditarFicha(t.dataset.u, t.dataset.id); break;
    case 'adm-f-usar': { t.disabled = true; try{ await D.adminAtivarFicha(t.dataset.u, t.dataset.id); S.adm.usuarios = null; admFichasSheet(t.dataset.u); carregarAdmin(); toast('Ficha ativada.'); }catch(err){ t.disabled = false; toast('Não consegui agora.', true); } break; }
    case 'adm-f-modelo': { const u = admUser(t.dataset.u); closeSheet(true); abrirEditor({nome:FICHA_MODELO.nome, order:FICHA_MODELO.order.slice(), w:copia(FICHA_MODELO.w), sched:Object.assign({}, FICHA_MODELO.sched), dono:{id:u.user_id, nome:u.nome||u.email}, aviso:'Ficha modelo. Ajuste e salve para '+(u.nome||u.email)+'.'}, 'admin'); break; }
    case 'adm-f-foto': { const u = admUser(t.dataset.u); S.admDono = {id:u.user_id, nome:u.nome||u.email}; closeSheet(true); const f=$('#f-ficha'); f.value=''; f.click(); break; }
    case 'adm-senha': { const u = admUser(t.dataset.u); if(S.confirmDel!=='senha-'+u.user_id){ S.confirmDel='senha-'+u.user_id; t.textContent='Toque de novo para enviar a '+u.email; break; }
      t.disabled = true; try{ await D.enviarLinkSenha(u.email); toast('Link enviado para '+u.email+'.'); t.textContent='Link enviado'; }catch(err){ t.disabled = false; toast('Não consegui enviar agora. O Supabase limita alguns envios por hora.', true); } break; }
    case 'adm-aviso': publicarAviso(t); break;
    case 'adm-aviso-on': { t.disabled = true; try{ await D.mudarAviso(t.dataset.id, t.dataset.v==='1'); S.adm.avisos = null; await carregarAdmin(); }catch(err){ t.disabled = false; toast('Não consegui agora.', true); } break; }
    case 'adm-aviso-del': if(S.confirmDel!=='av-'+t.dataset.id){ S.confirmDel='av-'+t.dataset.id; t.textContent='Apagar?'; break; }
      try{ await D.apagarAviso(t.dataset.id); S.adm.avisos = null; AVISOS = AVISOS.filter(a=>a.id!==t.dataset.id); await carregarAdmin(); toast('Aviso apagado.'); }catch(err){ toast('Não consegui agora.', true); } break;
    case 'adm-erros-limpar': if(S.confirmDel!=='erros'){ S.confirmDel='erros'; t.textContent='Toque de novo para apagar todos'; break; }
      try{ await D.limparErros(); S.adm.erros = null; S.adm.resumo = null; await carregarAdmin(); toast('Registro de erros limpo.'); }catch(err){ toast('Não consegui agora.', true); } break;
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
      abrirCompartilhar(t.dataset.t, ss, null, cq || null); break; }
    case 'share-tab': abrirCompartilhar(t.dataset.t, CARD.ref, CARD.titulo, CARD.conquista); break;
    case 'share-go': enviarCard(); break;
    case 'share-cq': { const c = minhasConquistas().find(x=>x.id===t.dataset.id); if(c && c.at) abrirCompartilhar('conquista', null, c.ico+' '+c.nome, c); break; }
    case 'share-ad': abrirCompartilhar('antesdepois', null, 'Antes e depois'); break;
    case 'share-retro': CARD.ano = anoRetro(); abrirCompartilhar('retro', null, 'Retrospectiva '+CARD.ano); break;
    case 'retro-x': LS.set('mt.retro.'+anoRetro(), true); { const c = t.closest('.aviso'); if(c) c.remove(); } break;
    case 'share-nv': { const c = conquistaNivel(nivel(pontos())); abrirCompartilhar('conquista', null, 'Nível '+c.nv.nome, c); break; }
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
    case 'ob-foto': { S.admDono = null; const f=$('#f-ficha'); f.value=''; f.click(); break; }
    // editor
    case 'f-cancel': if(S.edit && S.edit.dono){ S.edit = null; go('admin'); break; } S.edit = null; go(FICHA ? (S.editBack==='onboarding' ? 'treinos' : S.editBack) : 'onboarding'); break;
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
  if(el.id==='bib-q'){ filtrarBiblioteca(); return; }
  if(el.id==='cd-min'){ estimarCardio(); return; }
  if(el.dataset && el.dataset.he && S.editS){ editarCampoTreino(el); return; }
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
document.addEventListener('visibilitychange', ()=>{ if(document.hidden){ guardarCache(); return; } if(!document.hidden){ tickRest(); tickClock(); if(S.draft && S.view==='sessao') pedirTelaAcesa(); atualizarVivo(); } });
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
    NOME = d.nome || NOME; AVATAR = d.avatar; INSTA = d.instagram; AVATAR_IMG = null; METAS = d.metas || METAS; NOTIF = d.notif || NOTIF; LEM_HORA = d.lembreteHora || '';
    MISSOES = Array.isArray(d.missoes) ? d.missoes : [];
    AGUA = { dias: Object.assign({}, d.agua || {}, LS.get('mt.agua.pend.'+UID, {})), manual: d.aguaMeta || null };
    TEMA = d.tema || LS.get('mt.tema.'+UID, 'neon') || 'neon';
    FICHAS = d.fichas; definirFicha();
    CATALOGO = d.catalogo || []; prepararCatalogo(CATALOGO); autoCache.clear();
    VIDEOS = {}; (d.videos||[]).forEach(v=>{ VIDEOS[v.chave] = {nome:v.nome, video:v.video}; }); EDITOR = !!(d.editor || d.admin); ADMIN = !!d.admin; AVISOS = d.avisos || [];
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
    else { S.sync = 'ok'; enviarPendentes(); sincronizarAparelho(); salvarAguaDepois(); if(LS.get('mt.missoes.pend.'+UID, false)) D.salvarMissoes(UID, MISSOES).then(()=>LS.set('mt.missoes.pend.'+UID, false)).catch(()=>{}); }
    // tema: só vale se o nível já liberou
    { const t = TEMAS.find(x=>x.id===TEMA); aplicarTema(t ? TEMA : 'neon'); }
    verificarMissoes(false);
    carregarGrupo();
    abrirPeloLink();
  }catch(e){
    S.loadErr = 'Não consegui abrir seus dados. Tente de novo.';
    S.view = 'carregando'; render();
  }
}
// Links das notificações: ?card=semana abre o card da semana
function abrirPeloLink(){
  try{
    const q = new URLSearchParams(location.search);
    if(!q.has('card') && !q.has('v')) return;
    const card = q.get('card');
    history.replaceState(null, '', location.pathname);
    if(card==='semana' && FICHA && !S.draft) setTimeout(()=>abrirCompartilhar('semana', null, 'Sua semana'), 400);
  }catch(e){}
}
// Mantém a cópia do aparelho em dia (para abrir sem internet)
function guardarCache(){
  if(!UID) return;
  const c = LS.get(kDados(), null); if(!c) return;
  const pend = new Set(S.pending.map(p=>p.id));
  Object.assign(c, { treinos:S.sessions.filter(x=>!pend.has(x.id)), peso:S.body, avaliacoes:S.measures, fotos:S.photos, fichas:FICHAS, nome:NOME, avatar:AVATAR, instagram:INSTA,
    missoes:MISSOES, tema:TEMA, agua:AGUA.dias, aguaMeta:AGUA.manual,
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
  UID = null; EMAIL=''; NOME=''; AVATAR=''; INSTA=''; AVATAR_IMG=null; FICHAS=[]; FICHA=null; VIDEOS={}; EDITOR=false; ADMIN=false; AVISOS=[]; S.adm={};
  Object.assign(S, {sessions:[], body:[], measures:[], photos:[], draft:null, pending:[], edit:null, exSel:null, mSel:null, grupo:null, grupoM:null, grupoErr:false, offline:false, sync:'ok'});
  stopRest(); closeSheet(true); pararVivo(); soltarTela();
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
      await Promise.all(atuais.map(u=>cache.match(u, {ignoreVary:true}).then(m=>m || cache.add(u)).catch(()=>{})));
      const set = new Set(atuais);
      (await cache.keys()).forEach(req=>{ const p = new URL(req.url).pathname; if(/^\/assets\//.test(p) && !set.has(req.url)) cache.delete(req); });
    }catch(e){}
  });
}
