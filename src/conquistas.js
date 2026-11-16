// Conquistas, níveis e sequência de semanas ativas (tudo calculado no aparelho).

export const NIVEIS = [[0,'Iniciante'],[10,'Focado'],[25,'Constante'],[50,'Dedicado'],[100,'Atleta'],[200,'Elite'],[365,'Lenda']];

export function nivel(n){
  let i = 0; NIVEIS.forEach((x,j)=>{ if(n>=x[0]) i = j; });
  const atual = NIVEIS[i], prox = NIVEIS[i+1] || null;
  return { i, nome:atual[1], n, base:atual[0], prox: prox ? { n:prox[0], nome:prox[1] } : null,
    pct: prox ? Math.min(1, (n-atual[0])/(prox[0]-atual[0])) : 1 };
}

function pad(n){ return String(n).padStart(2,'0'); }
export function chaveDia(ts){ const d = new Date(ts); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function inicioSemana(ts){ const d = new Date(ts); d.setHours(0,0,0,0); d.setDate(d.getDate() - (d.getDay()+6)%7); return d.getTime(); }
function semanaAntes(ts){ const d = new Date(ts); d.setDate(d.getDate()-7); return d.getTime(); }
function deChave(dk){ const p = dk.split('-'); return new Date(+p[0], +p[1]-1, +p[2], 12).getTime(); }

// Semanas seguidas com pelo menos `min` dias de treino. A semana atual só conta
// quando já bateu o mínimo; se ainda não bateu, ela não quebra a sequência.
export function semanasAtivas(diasChave, agora = Date.now(), min = 3){
  const porSemana = new Map();
  new Set(diasChave).forEach(dk=>{ const w = inicioSemana(deChave(dk)); porSemana.set(w, (porSemana.get(w)||0)+1); });
  let w = inicioSemana(agora), n = 0;
  if((porSemana.get(w)||0) >= min) n++;
  w = semanaAntes(w);
  while((porSemana.get(w)||0) >= min){ n++; w = semanaAntes(w); }
  return n;
}

const LISTA = [
  ['t1','🏁','Primeiro treino','Registre seu primeiro treino', 'treinos', 1],
  ['t10','💪','10 treinos','Registre 10 treinos', 'treinos', 10],
  ['t25','🔥','25 treinos','Registre 25 treinos', 'treinos', 25],
  ['t50','⚡','50 treinos','Registre 50 treinos', 'treinos', 50],
  ['t100','🏆','100 treinos','Registre 100 treinos', 'treinos', 100],
  ['t200','👑','200 treinos','Registre 200 treinos', 'treinos', 200],
  ['t365','🦾','365 treinos','Um ano inteiro de treinos', 'treinos', 365],
  ['sem','📅','Semana completa','Bata a meta de dias da ficha numa semana', 'semana', 1],
  ['seq4','🔗','4 semanas seguidas','4 semanas seguidas com 3 ou mais treinos', 'seq', 4],
  ['seq12','⛓️','12 semanas seguidas','12 semanas seguidas com 3 ou mais treinos', 'seq', 12],
  ['mes20','🗓️','Mês de ferro','20 dias de treino no mesmo mês', 'mes', 20],
  ['v10','🏋️','10 toneladas','Some 10 t de volume levantado', 'vol', 10000],
  ['v50','🏗️','50 toneladas','Some 50 t de volume levantado', 'vol', 50000],
  ['v100','🚛','100 toneladas','Some 100 t de volume levantado', 'vol', 100000],
  ['v500','🛳️','500 toneladas','Some 500 t de volume levantado', 'vol', 500000],
  ['pr1','📈','Primeiro recorde','Bata sua carga máxima num exercício', 'pr', 1],
  ['pr10','🚀','10 recordes','Bata 10 recordes de carga', 'pr', 10],
  ['pr50','🌟','50 recordes','Bata 50 recordes de carga', 'pr', 50],
  ['perf','✅','Treino 100%','Faça todas as séries de um treino', 'perf', 1],
  ['cedo','🌅','Madrugador','Comece um treino antes das 7h', 'cedo', 1],
  ['tarde','🌙','Coruja','Comece um treino depois das 21h', 'tarde', 1],
  ['aval','📏','Avaliação registrada','Registre uma avaliação física', 'aval', 1],
  ['foto','📸','Primeiras fotos','Registre fotos de evolução', 'foto', 1]
];

function num(v){ const n = Number(v); return isFinite(n) ? n : null; }

// sessoes: [{start, dur, vol, done, total, ex}]; extra: {meta, avaliacoes:[ts], fotos:[ts]}
export function calcular(sessoes, extra = {}){
  const asc = sessoes.slice().sort((a,b)=>a.start-b.start);
  const meta = Math.max(1, extra.meta || 3);
  const at = {}, cont = { treinos:0, vol:0, pr:0, semana:0, seq:0, mes:0, perf:0, cedo:0, tarde:0, aval:0, foto:0 };
  const best = {}, semanas = new Map(), meses = new Map();
  const marca = (tipo, valor, ts)=>{ LISTA.forEach(([id,,,,t,alvo])=>{ if(t===tipo && valor>=alvo && !at[id]) at[id] = ts; }); };
  for(const s of asc){
    const ts = s.start, dk = chaveDia(ts);
    cont.treinos++; marca('treinos', cont.treinos, ts);
    cont.vol += num(s.vol) || 0; marca('vol', cont.vol, ts);
    const h = new Date(ts).getHours();
    if(h < 7){ cont.cedo++; marca('cedo', cont.cedo, ts); }
    if(h >= 21){ cont.tarde++; marca('tarde', cont.tarde, ts); }
    if(s.total > 0 && s.done >= s.total){ cont.perf++; marca('perf', cont.perf, ts); }
    // recordes de carga
    (s.ex||[]).forEach(e=>(e.keys||[e.key]).forEach((k,i)=>{
      let m = null; (e.sets||[]).forEach(st=>{ const kg = num(st.p && st.p[i] && st.p[i].kg); if(kg!=null && kg>0 && (m==null || kg>m)) m = kg; });
      if(m==null) return;
      if(best[k]!=null && m>best[k]){ cont.pr++; marca('pr', cont.pr, ts); }
      if(best[k]==null || m>best[k]) best[k] = m;
    }));
    // dias por semana e por mês
    const w = inicioSemana(ts);
    if(!semanas.has(w)) semanas.set(w, new Set());
    semanas.get(w).add(dk);
    const nSem = semanas.get(w).size;
    if(nSem >= meta){ cont.semana = Math.max(cont.semana, 1); marca('semana', 1, ts); }
    if(nSem >= 3){
      let run = 0, x = w;
      while(semanas.has(x) && semanas.get(x).size >= 3){ run++; x = semanaAntes(x); }
      cont.seq = Math.max(cont.seq, run); marca('seq', run, ts);
    }
    const ym = dk.slice(0,7);
    if(!meses.has(ym)) meses.set(ym, new Set());
    meses.get(ym).add(dk);
    cont.mes = Math.max(cont.mes, meses.get(ym).size); marca('mes', meses.get(ym).size, ts);
  }
  const av = (extra.avaliacoes||[]).filter(Boolean).sort((a,b)=>a-b);
  if(av.length){ cont.aval = av.length; marca('aval', av.length, av[0]); }
  const ft = (extra.fotos||[]).filter(Boolean).sort((a,b)=>a-b);
  if(ft.length){ cont.foto = ft.length; marca('foto', ft.length, ft[0]); }
  return LISTA.map(([id, ico, nome, desc, tipo, alvo])=>({
    id, ico, nome, desc: tipo==='semana' ? 'Treine '+meta+' dias numa semana (a meta da sua ficha)' : desc,
    at: at[id] || null, prog: [Math.min(cont[tipo], alvo), alvo], tipo
  }));
}
