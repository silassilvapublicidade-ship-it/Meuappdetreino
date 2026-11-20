// Evolução: força estimada, índice de força, recordes, mapa muscular, previsões, comparação de períodos e cruzamentos.
// Funções puras: recebem os dados e devolvem números; quem desenha é o main.js.

const DIA = 864e5, SEM = 7 * DIA;
const num = v => { if(v==null || v==='') return null; const n = Number(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
// força estimada (1RM, fórmula de Epley) de uma série
export function e1rm(kg, r){ if(!(kg > 0)) return null; const rr = Math.min(12, Math.max(1, r || 1)); return rr === 1 ? kg : kg * (1 + rr / 30); }

// séries por exercício (chave): [{t, kg (maior carga), top (reps nessa carga), e1 (maior 1RM estimado), reps, sets}]
export function seriesPorExercicio(sessions){
  const out = {};
  sessions.slice().sort((a,b)=>a.start-b.start).forEach(s=>{
    if(s.letter === 'CARDIO') return;
    (s.ex||[]).forEach(e=>(e.keys||[]).forEach((k,i)=>{
      let kg=null, top=null, e1=null, reps=0, n=0;
      (e.sets||[]).forEach(st=>{
        const p = (st.p||[])[i] || {}, w = num(p.kg), r = num(p.r) || 0;
        if(w==null && !r) return; n++;
        if(w!=null && (kg==null || w>kg || (w===kg && r>(top||0)))){ kg = w; top = r; }
        const x = e1rm(w, r); if(x && (e1==null || x>e1)) e1 = x;
        if(r > reps) reps = r;
      });
      if(!n) return;
      (out[k] = out[k] || []).push({ t: s.start, kg, top, e1, reps, n, sets: e.sets, i });
    }));
  });
  return out;
}

// Índice de força: média de (força atual ÷ força do primeiro registro) dos exercícios com carga, × 100.
function indiceEm(series, T){
  const rs = [];
  for(const k in series){
    const c = series[k].filter(p=>p.e1 && p.t <= T); if(!c.length) continue;
    const ult = c.slice(-2).reduce((m,p)=>Math.max(m, p.e1), 0); // melhor das duas últimas, para um dia ruim não derrubar
    rs.push(ult / c[0].e1);
  }
  return rs.length ? Math.round(rs.reduce((a,b)=>a+b,0) / rs.length * 1000) / 10 : null;
}
export function indiceForca(series, agora, semanas = 12){
  const pts = [];
  for(let i = semanas; i >= 0; i--){ const T = agora - i*SEM, v = indiceEm(series, T); if(v != null) pts.push({ x: T, y: v }); }
  const atual = indiceEm(series, agora), antes = indiceEm(series, agora - 4*SEM);
  const n = Object.values(series).filter(a=>a.some(p=>p.e1)).length;
  return { atual, antes, pts, n };
}
export { indiceEm };

// próximo marco redondo acima da carga
export function proximoMarco(kg){ const passo = kg < 20 ? 2 : kg < 60 ? 5 : kg < 150 ? 10 : 20; return Math.floor(kg / passo) * passo + passo; }

// recordes: maior carga de cada exercício (desempate pelas repetições)
export function recordes(series){
  return Object.entries(series).map(([k, a])=>{
    const c = a.filter(p=>p.kg > 0); if(!c.length) return null;
    const rec = c.reduce((m,p)=> p.kg > m.kg || (p.kg === m.kg && (p.top||0) > (m.top||0)) ? p : m);
    const marco = proximoMarco(rec.kg);
    return { k, kg: rec.kg, top: rec.top, t: rec.t, marco, falta: Math.round((marco - rec.kg) * 10) / 10, primeiro: c[0].kg };
  }).filter(Boolean).sort((a,b)=>b.t - a.t);
}

// evolução de cada exercício: % de ganho de carga (ou de reps, sem carga) e mini série
export function evolucaoExercicios(series){
  return Object.entries(series).map(([k, a])=>{
    const comKg = a.filter(p=>p.kg > 0), usaKg = comKg.length > 0, base = usaKg ? comKg : a;
    const v = p => usaKg ? p.kg : p.reps;
    const ini = v(base[0]), fim = Math.max(...base.slice(-2).map(v));
    const pct = ini > 0 && base.length > 1 ? Math.round((fim - ini) / ini * 100) : null;
    return { k, usaKg, ini, fim, dif: Math.round((fim - ini) * 10) / 10, pct, n: a.length, ult: a[a.length-1].t, spark: base.slice(-10).map(v) };
  });
}

/* ---------- Mapa muscular ---------- */
export const MUSCULOS = {
  peito: 'Peito', costas: 'Costas', ombros: 'Ombros', biceps: 'Bíceps', triceps: 'Tríceps', abdomen: 'Abdômen',
  quadriceps: 'Quadríceps', posterior: 'Posterior de coxa', gluteos: 'Glúteos', panturrilha: 'Panturrilha',
};
const tira = s => String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const REGRAS = [
  // [expressão, músculos principais, músculos secundários]
  [/panturrilha|gemeos|soleo|calf/, ['panturrilha']],
  [/abdominal|abdomen|prancha|crunch|infra|obliquo|roda abdominal|elevacao de pernas|canivete|dead ?bug/, ['abdomen']],
  [/flexora|nordic|leg curl/, ['posterior']],
  [/stiff|romeno|good ?morning/, ['posterior'], ['gluteos']],
  [/extensora/, ['quadriceps']],
  [/terra|deadlift/, ['posterior', 'gluteos'], ['costas']],
  [/elevacao pelvica|hip ?thrust|gluteo|abdutora|abducao|ponte|coice (de )?gluteo/, ['gluteos']],
  [/extensora|leg ?press|hack|agachamento|squat|afundo|bulgaro|passada|avanco|sissy|step ?up/, ['quadriceps'], ['gluteos']],
  [/adutora|aducao/, ['quadriceps']],
  [/crucifixo inverso|fly inverso|voador inverso|peck deck inverso|face ?pull|crucifixo invertido|posterior de ombro/, ['ombros'], ['costas']],
  [/remada alta/, ['ombros'], ['costas']],
  [/supino|crucifixo|fly|peck|crossover|cross over|flexao de braco|flexoes|chest/, ['peito'], ['triceps', 'ombros']],
  [/remada|puxada|pulldown|pull ?down|pullover|barra fixa|serrote|graviton|pull ?up|\bchin|\blat\b/, ['costas'], ['biceps']],
  [/encolhimento|trapezio/, ['costas']],
  [/desenvolvimento|elevacao lateral|elevacao frontal|arnold|militar|ombro/, ['ombros'], ['triceps']],
  [/triceps|testa|frances|mergulho|paralela|coice|kickback|pulley/, ['triceps']],
  [/rosca|biceps|martelo|curl/, ['biceps']],
];
export function musculosDe(nome){
  const n = tira(nome).replace(/[-_]/g, ' ');
  for(const [re, pri, sec] of REGRAS) if(re.test(n)) return { pri, sec: sec || [] };
  return { pri: [], sec: [] };
}
// séries feitas por músculo no intervalo [desde, ate]; secundário conta meia série
export function seriesPorMusculo(sessions, nomes, desde, ate){
  const tot = Object.fromEntries(Object.keys(MUSCULOS).map(m=>[m, 0])), ex = {};
  sessions.forEach(s=>{
    if(s.letter === 'CARDIO' || s.start < desde || s.start > ate) return;
    (s.ex||[]).forEach(e=>(e.keys||[]).forEach((k,i)=>{
      const feitas = (e.sets||[]).filter(st=>{ const p = (st.p||[])[i] || {}; return st.done || num(p.r) || num(p.kg); }).length;
      if(!feitas) return;
      const nome = nomes[k] || k, m = musculosDe(nome);
      m.pri.forEach(x=>{ tot[x] += feitas; (ex[x] = ex[x] || {})[k] = (ex[x][k]||0) + feitas; });
      m.sec.forEach(x=>{ tot[x] += feitas / 2; });
    }));
  });
  return { tot, ex };
}
export function nivelMusculo(porSemana){ return porSemana <= 0 ? 0 : porSemana < 6 ? 1 : porSemana < 12 ? 2 : 3; }

/* ---------- Previsões ---------- */
function regressao(pts){
  const n = pts.length; if(n < 2) return null;
  const mx = pts.reduce((s,p)=>s+p.x,0)/n, my = pts.reduce((s,p)=>s+p.y,0)/n;
  let a = 0, b = 0; pts.forEach(p=>{ a += (p.x-mx)*(p.y-my); b += (p.x-mx)**2; });
  if(!b) return null; const m = a / b; return { m, c: my - m*mx };
}
// peso: kg por semana nos últimos 90 dias e quando chega na meta
export function previsaoPeso(pesos, meta, agora){
  const pts = pesos.map(p=>({ x: new Date(p.d+'T12:00').getTime(), y: p.kg })).filter(p=>p.x >= agora - 90*DIA);
  if(pts.length < 3 || pts[pts.length-1].x - pts[0].x < 14*DIA) return null;
  const r = regressao(pts); if(!r) return null;
  const porSemana = r.m * SEM, hoje = r.m * agora + r.c, ult = pts[pts.length-1].y;
  const out = { porSemana: Math.round(porSemana*100)/100, em4: Math.round((hoje + 4*porSemana)*10)/10, ult };
  if(meta != null && Math.abs(porSemana) >= 0.05 && Math.sign(meta - ult) === Math.sign(porSemana) && Math.abs(meta-ult) >= 0.3){
    const sem = (meta - hoje) / porSemana;
    if(sem > 0 && sem <= 104) out.meta = { kg: meta, semanas: Math.round(sem), data: agora + sem*SEM };
  }
  return out;
}
// força: exercícios subindo, com a data provável do próximo marco
export function previsoesForca(series, nomes, agora, max = 3){
  const out = [];
  for(const [k, a] of Object.entries(series)){
    const c = a.filter(p=>p.kg > 0 && p.t >= agora - 120*DIA).slice(-8);
    if(c.length < 4) continue;
    const r = regressao(c.map(p=>({ x: p.t, y: p.kg }))); if(!r || r.m <= 0) continue;
    const melhor = Math.max(...c.map(p=>p.kg)), marco = proximoMarco(melhor), hoje = r.m*agora + r.c;
    const sem = (marco - hoje) / (r.m * SEM);
    if(!(sem > 0 && sem <= 26)) continue;
    out.push({ k, nome: nomes[k] || k, melhor, marco, semanas: Math.max(1, Math.round(sem)), data: agora + sem*SEM, ritmo: r.m*SEM*4 });
  }
  return out.sort((a,b)=>a.semanas - b.semanas).slice(0, max);
}

/* ---------- Comparar períodos ---------- */
const media = a => a.length ? a.reduce((x,y)=>x+y,0) / a.length : null;
export function periodo(dados, desde, ate){
  const { sessions, series, pesos, noites, duracao, agua, chave } = dados;
  const ss = sessions.filter(s=>s.start >= desde && s.start <= ate);
  const forca = ss.filter(s=>s.letter !== 'CARDIO');
  const ps = pesos.filter(p=>{ const t = new Date(p.d+'T12:00').getTime(); return t >= desde && t <= ate; });
  const sono = Object.entries(noites).filter(([d])=>d >= chave(desde) && d <= chave(ate)).map(([,n])=>duracao(n));
  const ag = Object.entries(agua).filter(([d,v])=>v > 0 && d >= chave(desde) && d <= chave(ate)).map(([,v])=>v);
  return {
    treinos: forca.length, cardio: ss.length - forca.length,
    vol: forca.reduce((n,s)=>n + (Number(s.vol)||0), 0) / 1000,
    forca: indiceEm(series, ate),
    peso: ps.length ? ps[ps.length-1].kg : null,
    sono: media(sono), agua: media(ag),
  };
}

/* ---------- Cruzamentos ---------- */
// rendimento de um treino = volume ÷ média de volume daquele treino (A, B…), para comparar dias diferentes
function rendimentos(sessions){
  const forca = sessions.filter(s=>s.letter !== 'CARDIO' && Number(s.vol) > 0);
  const porL = {}; forca.forEach(s=>{ (porL[s.letter] = porL[s.letter] || []).push(Number(s.vol)); });
  const med = Object.fromEntries(Object.entries(porL).map(([l,a])=>[l, media(a)]));
  return forca.filter(s=>porL[s.letter].length >= 2).map(s=>({ s, r: Number(s.vol) / med[s.letter] }));
}
const pctDif = (a, b) => Math.round((media(a) / media(b) - 1) * 100);
export function cruzamentos(dados){
  const { sessions, noites, duracao, agua, metaAgua, pesos, chave, durTxt } = dados;
  const out = [], falta = [];
  const R = rendimentos(sessions);
  // 1. sono x rendimento
  const comSono = R.map(x=>{ const n = noites[chave(x.s.start)]; return n ? { r: x.r, m: duracao(n) } : null; }).filter(Boolean);
  const bem = comSono.filter(x=>x.m >= 420).map(x=>x.r), mal = comSono.filter(x=>x.m < 420).map(x=>x.r);
  if(bem.length >= 3 && mal.length >= 3){
    const d = pctDif(bem, mal);
    if(Math.abs(d) >= 3) out.push(['🌙', d > 0 ? `Nos dias em que você dormiu <b>7h ou mais</b>, rendeu <b>${d}% a mais</b> no treino (volume comparado ao mesmo treino).` : `Curioso: nos dias com menos de 7h de sono você rendeu ${-d}% a mais. Vale observar mais algumas semanas.`]);
    else out.push(['🌙', 'Seu rendimento no treino ficou parecido dormindo mais ou menos de 7h.']);
  } else falta.push('sono');
  // 2. treino x sono da noite seguinte
  const diasTreino = new Set(sessions.filter(s=>s.letter !== 'CARDIO').map(s=>chave(s.start)));
  const apos = [], semT = [];
  Object.entries(noites).forEach(([d, n])=>{ const t = new Date(d+'T12:00').getTime() - DIA; (diasTreino.has(chave(t)) ? apos : semT).push(duracao(n)); });
  if(apos.length >= 3 && semT.length >= 3){
    const d = Math.round(media(apos) - media(semT));
    if(Math.abs(d) >= 10) out.push(['😴', d > 0 ? `Depois de dias de treino você dorme <b>${durTxt(d)} a mais</b>, em média.` : `Depois de dias de treino você dorme ${durTxt(-d)} a menos. Evite treinar muito perto da hora de dormir.`]);
  }
  // 3. frequência x peso
  const P = pesos.map(p=>({ t: new Date(p.d+'T12:00').getTime(), kg: p.kg }));
  const muito = [], pouco = [];
  for(let i = 1; i < P.length; i++){
    const a = P[i-1], b = P[i], dias = (b.t - a.t) / DIA; if(dias < 5 || dias > 21) continue;
    const n = sessions.filter(s=>s.letter !== 'CARDIO' && s.start >= a.t && s.start < b.t).length / (dias/7);
    (n >= 4 ? muito : pouco).push((b.kg - a.kg) / (dias/7));
  }
  if(muito.length >= 2 && pouco.length >= 2){
    const m = media(muito), p = media(pouco), f = v => (v>0?'+':'') + v.toFixed(2).replace('.', ',') + ' kg';
    out.push(['⚖️', `Nas semanas com <b>4 treinos ou mais</b> seu peso variou <b>${f(m)}</b> por semana; nas outras, ${f(p)}.`]);
  } else falta.push('peso');
  // 4. horário do treino
  const per = { manhã: [], tarde: [], noite: [] };
  R.forEach(x=>{ const h = new Date(x.s.start).getHours(); per[h < 12 ? 'manhã' : h < 18 ? 'tarde' : 'noite'].push(x.r); });
  const ok = Object.entries(per).filter(([,a])=>a.length >= 3);
  if(ok.length >= 2){
    ok.sort((a,b)=>media(b[1]) - media(a[1]));
    const d = pctDif(ok[0][1], ok[ok.length-1][1]);
    if(d >= 4) out.push(['🕐', `Você rende <b>${d}% mais</b> treinando de <b>${ok[0][0]}</b> do que de ${ok[ok.length-1][0]}.`]);
  }
  // 5. água x rendimento
  const comAgua = R.map(x=>{ const d = chave(x.s.start), v = agua[d]; return v ? { r: x.r, ok: v >= metaAgua(d) } : null; }).filter(Boolean);
  const aOk = comAgua.filter(x=>x.ok).map(x=>x.r), aNao = comAgua.filter(x=>!x.ok).map(x=>x.r);
  if(aOk.length >= 3 && aNao.length >= 3){
    const d = pctDif(aOk, aNao);
    if(Math.abs(d) >= 3) out.push(['💧', d > 0 ? `Nos dias em que bateu a meta de água, rendeu <b>${d}% a mais</b> no treino.` : `Nos dias em que bateu a meta de água o rendimento foi ${-d}% menor. Ainda são poucos dias para concluir.`]);
  } else falta.push('água');
  // 6. dia da semana que mais falha
  return { lista: out, falta };
}
