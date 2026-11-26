// Engajamento: sequência de dias de treino com proteção mensal, missões da semana,
// temas desbloqueáveis por nível e meta de água. Tudo calculado no aparelho.
import { chaveDia } from './conquistas.js';

function meioDia(dk){ const p = dk.split('-'); return new Date(+p[0], +p[1]-1, +p[2], 12); }
function diaAntes(dt){ const d = new Date(dt); d.setDate(d.getDate()-1); return d; }
function diaDepois(dt){ const d = new Date(dt); d.setDate(d.getDate()+1); return d; }
function ehTreino(v){ return !!v && v!=='ativo' && v!=='total'; }

/* ---------- Sequência ---------- */
// Conta os dias de treino seguidos. Dias de folga da ficha não quebram a sequência.
// Um dia de treino perdido por mês é coberto automaticamente pela proteção 🛡️.
// Hoje ainda não quebra: dá tempo de treinar.
export function sequencia({ dias, sched, agora = Date.now() }){
  const set = new Set(dias);
  const hoje = chaveDia(agora), mesHoje = hoje.slice(0,7);
  const vazio = { n:0, recorde:0, protegidos:[], protecaoMes:true, hojeFeito:false, hojeTreino:false, emRisco:false };
  if(!set.size) return Object.assign(vazio, { hojeTreino: ehTreino(sched && sched[new Date(agora).getDay()]) });
  const ini = [...set].sort()[0];
  const previsto = dk => ehTreino(sched && sched[meioDia(dk).getDay()]);
  // atual: de hoje para trás
  let n = 0; const usadas = new Set(), protegidos = [];
  for(let d = meioDia(hoje), i = 0; i < 800; i++, d = diaAntes(d)){
    const dk = chaveDia(d.getTime());
    if(dk < ini) break;
    if(set.has(dk)){ n++; continue; }
    if(dk===hoje || !previsto(dk)) continue;
    const mes = dk.slice(0,7);
    if(!usadas.has(mes)){ usadas.add(mes); protegidos.push(dk); continue; }
    break;
  }
  // recorde: do primeiro dia até hoje
  let cur = 0, rec = 0; const usadasR = new Set();
  for(let d = meioDia(ini), i = 0; i < 3000; i++, d = diaDepois(d)){
    const dk = chaveDia(d.getTime());
    if(dk > hoje) break;
    if(set.has(dk)){ cur++; rec = Math.max(rec, cur); continue; }
    if(dk===hoje || !previsto(dk)) continue;
    const mes = dk.slice(0,7);
    if(!usadasR.has(mes)){ usadasR.add(mes); continue; }
    cur = 0;
  }
  const hojeFeito = set.has(hoje), hojeTreino = previsto(hoje);
  // em risco: hoje é dia de treino, ainda não treinou e a proteção do mês já foi usada
  const emRisco = hojeTreino && !hojeFeito && n > 0 && usadas.has(mesHoje);
  return { n, recorde: Math.max(rec, n), protegidos, protecaoMes: !usadas.has(mesHoje), hojeFeito, hojeTreino, emRisco };
}

/* ---------- Missões da semana ---------- */
export function chaveSemana(ts){
  const d = new Date(ts); d.setHours(12,0,0,0); d.setDate(d.getDate() - (d.getDay()+6)%7);
  return chaveDia(d.getTime());
}
function semente(txt){ let h = 2166136261; for(const c of txt){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

// ctx: { meta, treinos, recordes, peso, cardios, completos, sabado, reacoes, aguaDias, volume, volumeAntes, grupo }
const POOL = [
  { id:'recorde',  ico:'🏆', txt:()=>'Bata 1 recorde de carga',            alvo:()=>1, prog:c=>c.recordes },
  { id:'peso',     ico:'⚖️', txt:()=>'Registre seu peso',                  alvo:()=>1, prog:c=>c.peso ? 1 : 0 },
  { id:'cardio',   ico:'🏃', txt:()=>'Faça 2 cardios',                     alvo:()=>2, prog:c=>c.cardios },
  { id:'completo', ico:'✅', txt:()=>'Complete todas as séries em 2 treinos', alvo:()=>2, prog:c=>c.completos },
  { id:'agua',     ico:'💧', txt:()=>'Bata a meta de água em 4 dias',      alvo:()=>4, prog:c=>c.aguaDias },
  { id:'sono',     ico:'🌙', txt:()=>'Durma 7 horas ou mais em 4 noites', alvo:()=>4, prog:c=>c.sonoBom||0, desde:'2026-11-23' },
  { id:'reagir',   ico:'👏', txt:()=>'Reaja ao treino de 3 pessoas do grupo', alvo:()=>3, prog:c=>c.reacoes, grupo:true },
  { id:'sabado',   ico:'👨‍👩‍👦', txt:()=>'Treine no sábado com a família',   alvo:()=>1, prog:c=>c.sabado ? 1 : 0, grupo:true },
];
export function missoesDaSemana(ctx, uid, ts = Date.now()){
  const sem = chaveSemana(ts);
  const fixa = { id:'treinos', ico:'🔥', txt:c=>`Treine ${c.meta} vezes`, alvo:c=>c.meta, prog:c=>c.treinos };
  const pool = POOL.filter(m=>(!m.grupo || ctx.grupo) && (!m.desde || sem >= m.desde)).map(m=>({ m, k: semente(sem+'|'+uid+'|'+m.id) })).sort((a,b)=>a.k-b.k).map(x=>x.m);
  return [fixa, pool[0], pool[1]].filter(Boolean).map(m=>{
    const alvo = m.alvo(ctx), feito = Math.min(m.prog(ctx), alvo);
    return { id: sem+':'+m.id, ico:m.ico, txt:m.txt(ctx), alvo, feito, ok: m.prog(ctx) >= alvo, un:m.un||'' };
  });
}

/* ---------- Temas ---------- */
// nivel = índice em NIVEIS (0 Iniciante, 1 Focado, 2 Constante, 3 Dedicado, 4 Atleta, 5 Elite, 6 Lenda)
export const TEMAS = [
  { id:'neon',    nome:'Neon',       nivel:0, cor:['#3cc9ff','#43e3ad'] },
  { id:'oceano',  nome:'Oceano',     nivel:1, cor:['#4f8dff','#38d6e8'] },
  { id:'fogo',    nome:'Fogo',       nivel:2, cor:['#ff7a3d','#ffc145'] },
  { id:'violeta', nome:'Cíntia',     nivel:3, cor:['#9333ea','#c084fc'] },
  { id:'floresta',nome:'Floresta',   nivel:4, cor:['#7bd88f','#d6f26b'] },
  { id:'ouro',    nome:'Ouro',       nivel:5, cor:['#ffcf5a','#f5e6b8'] },
  { id:'lenda',   nome:'Lenda',      nivel:6, cor:['#ff4d6d','#ffd166'] },
];
export function aplicarTema(id){
  const t = TEMAS.find(x=>x.id===id) || TEMAS[0];
  if(t.id==='neon') document.documentElement.removeAttribute('data-tema');
  else document.documentElement.setAttribute('data-tema', t.id);
  return t;
}

/* ---------- Água ---------- */
// 35 ml por kg de peso, +500 ml em dia de treino. Sem peso registrado: 2,5 L.
export function metaAgua({ peso, manual, treinoHoje }){
  if(manual) return manual;
  const base = peso ? Math.round(peso*35/50)*50 : 2500;
  return Math.min(6000, Math.max(1500, base + (treinoHoje ? 500 : 0)));
}
export function litros(ml){ return (ml/1000).toLocaleString('pt-BR', { minimumFractionDigits:1, maximumFractionDigits:2 }); }
