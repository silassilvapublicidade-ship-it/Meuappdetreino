// Sono: duração, médias, regularidade e dicas. Cada noite fica no dia em que a pessoa acordou.
import { chaveDia } from './conquistas.js';

export const QUALIDADE = [[1,'😫','Péssima'],[2,'😕','Ruim'],[3,'😐','Ok'],[4,'🙂','Boa'],[5,'😴','Ótima']];

export function duracao(n){ return Math.max(0, Math.round((new Date(n.acordou) - new Date(n.dormiu)) / 60000)); }
function minutos(ts){ const d = new Date(ts); return d.getHours()*60 + d.getMinutes(); }
// horário de dormir medido a partir do meio-dia, para a média não quebrar na meia-noite
function minDormir(ts){ const m = minutos(ts); return m < 12*60 ? m + 1440 : m; }
export function horaTxt(min){ min = ((Math.round(min) % 1440) + 1440) % 1440; return String(Math.floor(min/60)).padStart(2,'0') + ':' + String(min%60).padStart(2,'0'); }
export function horaDe(ts){ return horaTxt(minutos(ts)); }
export function durTxt(min){ min = Math.round(min); const h = Math.floor(min/60), m = min % 60; return h + 'h' + (m ? String(m).padStart(2,'0') : ''); }
function media(a){ return a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0; }
function desvio(a){ if(a.length < 2) return 0; const m = media(a); return Math.sqrt(media(a.map(x=>(x-m)**2))); }

// noites: { [dia]: {dormiu, acordou, q, obs} } · intervalo de dias [desde, ate] (chaves AAAA-MM-DD)
export function estatisticas(noites, meta, desde, ate){
  const lista = Object.entries(noites).filter(([d])=>d>=desde && d<=ate).map(([dia,n])=>Object.assign({ dia, min: duracao(n) }, n)).sort((a,b)=>a.dia<b.dia?-1:1);
  if(!lista.length) return { n:0, lista };
  const mins = lista.map(x=>x.min), dorm = lista.map(x=>minDormir(x.dormiu)), acor = lista.map(x=>minutos(x.acordou));
  const qs = lista.filter(x=>x.q).map(x=>x.q);
  return {
    n: lista.length, lista,
    media: media(mins),
    dormir: media(dorm), acordar: media(acor),
    desvio: desvio(dorm),
    debito: lista.reduce((s,x)=>s + Math.max(0, meta - x.min), 0),
    curtas: lista.filter(x=>x.min < 360).length,
    metaOk: lista.filter(x=>x.min >= meta - 15).length,
    melhor: lista.reduce((a,b)=>b.min>a.min?b:a), pior: lista.reduce((a,b)=>b.min<a.min?b:a),
    qualidade: qs.length ? media(qs) : null
  };
}

// Dicas a partir da semana e do mês. sessoes: [{start}] para cruzar sono com treino.
export function dicas(noites, meta, hoje, sessoes){
  const out = [];
  const d = n => { const t = new Date(hoje); t.setHours(12,0,0,0); t.setDate(t.getDate()-n); return chaveDia(t.getTime()); };
  const sem = estatisticas(noites, meta, d(6), d(0)), mes = estatisticas(noites, meta, d(29), d(0));
  if(!mes.n) return out;
  if(sem.n >= 3){
    const dif = sem.media - meta;
    if(dif <= -45) out.push(['⚠️', `Nesta semana você dormiu em média <b>${durTxt(sem.media)}</b>, ${durTxt(-dif)} abaixo da sua meta. Sono curto atrapalha a recuperação muscular e aumenta a fome.`]);
    else if(dif >= -15) out.push(['✅', `Média de <b>${durTxt(sem.media)}</b> por noite nesta semana: dentro da sua meta. Seu corpo agradece.`]);
    if(sem.debito >= 120) out.push(['⏰', `Débito de sono da semana: <b>${durTxt(sem.debito)}</b>. Deitar 30 minutos mais cedo nas próximas noites ajuda a recuperar.`]);
    if(sem.curtas >= 2) out.push(['😵', `<b>${sem.curtas} noites</b> com menos de 6 horas nesta semana. Em dias assim, prefira manter a carga em vez de buscar recorde.`]);
  }
  if(mes.n >= 4){
    const dv = Math.round(mes.desvio);
    if(dv > 60) out.push(['🔀', `Seu horário de dormir varia cerca de <b>±${durTxt(dv)}</b>. Dormir e acordar perto do mesmo horário todo dia melhora a qualidade do sono.`]);
    else if(dv <= 30) out.push(['🎯', `Horário de dormir bem regular (±${dv} min). Isso ajuda muito na recuperação.`]);
  }
  // fim de semana x dias úteis (horário de acordar)
  const fds = [], uteis = [];
  Object.entries(noites).forEach(([dia,n])=>{ if(dia < d(29)) return; const p = dia.split('-'); const wd = new Date(+p[0], +p[1]-1, +p[2], 12).getDay(); (wd===0||wd===6 ? fds : uteis).push(minutos(n.acordou)); });
  if(fds.length >= 2 && uteis.length >= 3){ const dif = media(fds) - media(uteis); if(dif >= 90) out.push(['🛌', `No fim de semana você acorda <b>${durTxt(dif)}</b> mais tarde. Uma diferença grande bagunça o relógio do corpo na segunda.`]); }
  // sono x treino (últimos 30 dias)
  const diasTreino = new Set((sessoes||[]).map(s=>chaveDia(s.start)));
  const antes = [], outras = [];
  Object.entries(noites).forEach(([dia,n])=>{ if(dia < d(29)) return; (diasTreino.has(dia) ? antes : outras).push(duracao(n)); });
  if(antes.length >= 3 && outras.length >= 2){
    const a = media(antes), o = media(outras);
    if(Math.abs(a-o) >= 20) out.push(['🏋️', `Antes dos dias de treino você dorme em média <b>${durTxt(a)}</b>; nas outras noites, ${durTxt(o)}.`]);
  }
  if(mes.qualidade && mes.qualidade <= 2.5) out.push(['💤', 'Você tem marcado o sono como ruim. Evitar tela e cafeína à noite e manter o quarto escuro costuma ajudar. Se continuar, vale conversar com um médico.']);
  return out;
}
