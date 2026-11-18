// Imagens para compartilhar no formato do story do Instagram (1080 x 1920).
// Conteúdo importante fica entre y=230 e y=1680 (o Instagram cobre topo e rodapé).

const W = 1080, H = 1920;
const COR = { bg:'#04080b', ink:'#f2f8f9', muted:'#8ca2ab', soft:'#5d737c', cyan:'#3cc9ff', mint:'#43e3ad', line:'#1d3a46', dim:'#27404a' };
const DISPLAY = '"Bebas Neue", "Oswald", Impact, "Arial Narrow", sans-serif';
const BODY = 'Montserrat, system-ui, sans-serif';
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

async function fontes(){
  try{ await Promise.all(['400 200px "Bebas Neue"','800 40px Montserrat','700 30px Montserrat','600 28px Montserrat'].map(f=>document.fonts.load(f))); }catch(e){}
}
function pad(n){ return String(n).padStart(2,'0'); }
function dataBR(ts){ const d = new Date(ts); return pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear(); }
export function tempoTxt(seg){
  const m = Math.max(0, Math.floor((seg||0)/60));
  if(m < 60) return m+' min';
  const h = Math.floor(m/60), r = m%60;
  return r ? h+'h'+pad(r) : h+'h';
}

/* ---------- fundo ---------- */
function base(){
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = COR.bg; x.fillRect(0,0,W,H);
  glow(x, -80, 120, 1000, 'rgba(30,120,180,.55)');
  glow(x, W+60, H-180, 1100, 'rgba(30,150,115,.42)');
  glow(x, W*0.75, H*0.38, 700, 'rgba(60,201,255,.10)');
  x.save(); x.globalAlpha = 0.045; x.strokeStyle = '#ffffff'; x.lineWidth = 1.2;
  for(let i=-H; i<W; i+=30){ x.beginPath(); x.moveTo(i,0); x.lineTo(i+H,H); x.stroke(); }
  x.restore();
  const v = x.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.75); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.55)');
  x.fillStyle = v; x.fillRect(0,0,W,H);
  const g = x.getImageData(0,0,W,H), d = g.data;
  for(let i=0;i<d.length;i+=4){ const n = (Math.random()-0.5)*14; d[i]+=n; d[i+1]+=n; d[i+2]+=n; }
  x.putImageData(g,0,0);
  return [c, x];
}
function glow(x, cx, cy, r, cor){ const g = x.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,cor); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0,0,W,H); }
function rr(x, l, t, w, h, r){ x.beginPath(); x.moveTo(l+r,t); x.arcTo(l+w,t,l+w,t+h,r); x.arcTo(l+w,t+h,l,t+h,r); x.arcTo(l,t+h,l,t,r); x.arcTo(l,t,l+w,t,r); x.closePath(); }
function gradTxt(x, y0, y1){ const g = x.createLinearGradient(0,y0,0,y1); g.addColorStop(0,'#7ff5cf'); g.addColorStop(1,COR.cyan); return g; }


/* ---------- equipamento no fundo (halter e anilha, bem transparentes) ---------- */
function equipamento(x){
  const traco = (a)=>{ const g = x.createLinearGradient(0,0,W,H); g.addColorStop(0,`rgba(60,201,255,${a})`); g.addColorStop(1,`rgba(67,227,173,${a})`); return g; };
  // anilha cortada no canto superior direito
  x.save();
  x.translate(W - 30, 560);
  x.globalAlpha = 0.8; x.lineWidth = 5; x.strokeStyle = traco(0.16); x.shadowColor = 'rgba(60,201,255,.5)'; x.shadowBlur = 18;
  [330, 300, 210, 150, 62].forEach((r,i)=>{ x.beginPath(); x.arc(0,0,r,0,Math.PI*2); x.lineWidth = i===0||i===4 ? 6 : 3; x.stroke(); });
  x.fillStyle = 'rgba(60,201,255,.035)'; x.beginPath(); x.arc(0,0,300,0,Math.PI*2); x.arc(0,0,210,0,Math.PI*2,true); x.fill();
  // furos de pegada
  [0.75, 2.35, 3.9, 5.45].forEach(a=>{ x.beginPath(); x.ellipse(Math.cos(a)*255, Math.sin(a)*255, 34, 20, a, 0, Math.PI*2); x.lineWidth = 3; x.stroke(); });
  x.font = `400 64px ${DISPLAY}`; x.fillStyle = 'rgba(67,227,173,.12)'; x.textAlign = 'center'; x.shadowBlur = 0;
  x.save(); x.rotate(-0.5); x.fillText('20 KG', -10, -232); x.restore();
  x.restore();

  // halter grande na diagonal
  x.save();
  x.translate(W*0.58, 1790); x.rotate(-0.30); x.globalAlpha = 0.8;
  x.lineJoin = 'round'; x.shadowColor = 'rgba(67,227,173,.45)'; x.shadowBlur = 16;
  const stroke = (a, lw)=>{ x.lineWidth = lw; x.strokeStyle = traco(a); x.stroke(); };
  const fill = a=>{ x.fillStyle = `rgba(60,201,255,${a})`; x.fill(); };
  // pegada com recartilhado
  rr(x, -230, -26, 460, 52, 14); fill(0.03); stroke(0.18, 4);
  x.save(); x.beginPath(); rr(x, -220, -24, 440, 48, 12); x.clip();
  x.lineWidth = 1.5; x.strokeStyle = 'rgba(60,201,255,.12)';
  for(let i=-260; i<260; i+=16){ x.beginPath(); x.moveTo(i,-30); x.lineTo(i+30,30); x.stroke(); x.beginPath(); x.moveTo(i+30,-30); x.lineTo(i,30); x.stroke(); }
  x.restore();
  [-1, 1].forEach(lado=>{
    let px = 240;
    const pecas = [[40, 120, 12], [70, 300, 20], [62, 270, 18], [54, 236, 16], [34, 120, 10]]; // [largura, altura, raio]
    pecas.forEach(([w,h,r])=>{
      const l = lado>0 ? px : -px - w;
      rr(x, l, -h/2, w, h, r); fill(0.035); stroke(0.2, 4);
      px += w + 6;
    });
    // ponta
    const l = lado>0 ? px : -px - 26;
    rr(x, l, -22, 26, 44, 8); stroke(0.18, 3);
  });
  x.restore();
}

/* ---------- aulas: bike de spinning e mini trampolim (traço transparente) ---------- */
function equipamentoAula(x, tipo){
  const traco = a=>{ const g = x.createLinearGradient(-400,-300,400,300); g.addColorStop(0,`rgba(60,201,255,${a})`); g.addColorStop(1,`rgba(67,227,173,${a})`); return g; };
  x.save();
  x.lineCap = 'round'; x.lineJoin = 'round'; x.shadowColor = 'rgba(60,201,255,.5)'; x.shadowBlur = 18;
  const linha = (pts, lw, a)=>{ x.beginPath(); pts.forEach(([px,py],i)=> i ? x.lineTo(px,py) : x.moveTo(px,py)); x.lineWidth = lw; x.strokeStyle = traco(a); x.stroke(); };
  if(tipo==='Spinning'){
    x.translate(W - 250, 560); x.rotate(-0.06);
    // volante
    x.beginPath(); x.arc(-200, 70, 150, 0, Math.PI*2); x.lineWidth = 7; x.strokeStyle = traco(0.2); x.stroke();
    x.beginPath(); x.arc(-200, 70, 118, 0, Math.PI*2); x.lineWidth = 3; x.strokeStyle = traco(0.14); x.stroke();
    x.beginPath(); x.arc(-200, 70, 34, 0, Math.PI*2); x.lineWidth = 5; x.strokeStyle = traco(0.2); x.stroke();
    for(let i=0;i<8;i++){ const a = i*Math.PI/4; linha([[-200+Math.cos(a)*34, 70+Math.sin(a)*34],[-200+Math.cos(a)*118, 70+Math.sin(a)*118]], 2, 0.1); }
    // base e quadro
    linha([[-400, 270],[330, 270]], 12, 0.18);
    linha([[-260, 270],[-140, -170]], 9, 0.2);
    linha([[230, 270],[120, -40]], 9, 0.2);
    linha([[-140, -170],[60, 100]], 9, 0.2);
    linha([[60, 100],[140, -200]], 9, 0.2);
    // banco e guidão
    x.beginPath(); rr(x, 70, -238, 170, 34, 16); x.lineWidth = 6; x.strokeStyle = traco(0.22); x.stroke();
    linha([[-140, -170],[-170, -280],[-300, -300],[-330, -270]], 8, 0.22);
    // pedivela e pedal
    x.beginPath(); x.arc(60, 100, 52, 0, Math.PI*2); x.lineWidth = 5; x.strokeStyle = traco(0.2); x.stroke();
    linha([[60, 100],[130, 170]], 8, 0.22); linha([[105, 172],[160, 172]], 10, 0.22);
  } else {
    x.translate(W - 260, 600);
    // linhas de salto
    [[-40, -330, 120],[60, -380, 150],[150, -320, 110]].forEach(([cx, cy, r])=>{ x.beginPath(); x.arc(cx, cy, r, Math.PI*1.1, Math.PI*1.9); x.lineWidth = 4; x.strokeStyle = traco(0.14); x.stroke(); });
    // armação e lona
    x.beginPath(); x.ellipse(0, 0, 360, 70, 0, 0, Math.PI*2); x.lineWidth = 9; x.strokeStyle = traco(0.22); x.stroke();
    x.beginPath(); x.ellipse(0, 0, 290, 50, 0, 0, Math.PI*2); x.lineWidth = 4; x.strokeStyle = traco(0.16); x.stroke();
    x.fillStyle = 'rgba(60,201,255,.04)'; x.fill();
    // molas
    for(let i=0;i<18;i++){ const a = i*Math.PI*2/18, c = Math.cos(a), sn = Math.sin(a);
      const p0 = [c*296, sn*52], p1 = [c*352, sn*68];
      const pts = []; for(let k=0;k<=6;k++){ const t = k/6, off = (k%2 ? 7 : -7); pts.push([p0[0]+(p1[0]-p0[0])*t - sn*off, p0[1]+(p1[1]-p0[1])*t + c*off*0.3]); }
      linha(pts, 2.5, 0.16); }
    // pernas
    [-290, -110, 110, 290].forEach(px=>{ const top = Math.sqrt(Math.max(0, 1 - (px/360)**2))*70; linha([[px, top],[px*1.08, 210]], 8, 0.2); linha([[px*1.08-24, 210],[px*1.08+24, 210]], 8, 0.2); });
    // barra de apoio
    linha([[0, -60],[0, -300]], 8, 0.2); linha([[-90, -300],[90, -300]], 9, 0.22);
  }
  x.restore();
}

/* ---------- peças ---------- */
function marca(x, ts){
  x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  x.font = `400 64px ${DISPLAY}`;
  x.save(); x.shadowColor = 'rgba(60,201,255,.9)'; x.shadowBlur = 16; x.strokeStyle = COR.cyan; x.lineWidth = 2; x.strokeText('MEUS', 80, 290); x.restore();
  const w = x.measureText('MEUS ').width;
  x.fillStyle = COR.mint; x.fillText('TREINOS', 80 + w, 290);
  x.textAlign = 'right'; x.font = `700 30px ${BODY}`; x.fillStyle = COR.muted; x.fillText(dataBR(ts), W-80, 284);
  const g = x.createLinearGradient(80,0,W-80,0); g.addColorStop(0,'rgba(60,201,255,.7)'); g.addColorStop(.5,'rgba(67,227,173,.35)'); g.addColorStop(1,'rgba(67,227,173,0)');
  x.fillStyle = g; x.fillRect(80, 318, W-160, 2);
}
function espacado(x, txt, cx, y, sp, align='center'){
  const larg = [...txt].reduce((n,ch)=>n + x.measureText(ch).width + sp, -sp);
  let px = align==='center' ? cx - larg/2 : cx; x.textAlign = 'left';
  for(const ch of txt){ x.fillText(ch, px, y); px += x.measureText(ch).width + sp; }
  return px;
}
function rotulo(x, txt, y, cor=COR.mint){
  x.font = `800 28px ${BODY}`; x.fillStyle = cor;
  x.fillRect(80, y-11, 44, 4);
  espacado(x, txt, 142, y, 7, 'left');
}
function letraFundo(x, letra){
  x.save(); x.font = `400 1350px ${DISPLAY}`; x.textAlign = 'right';
  x.globalAlpha = 0.11; x.lineWidth = 6; x.strokeStyle = COR.cyan; x.shadowColor = COR.cyan; x.shadowBlur = 40;
  x.strokeText(letra, W+90, 1260); x.restore();
}
function painel(x, l, t, w, h){
  x.save(); rr(x, l, t, w, h, 26);
  x.fillStyle = 'rgba(13,30,38,.72)'; x.fill();
  const g = x.createLinearGradient(l,t,l+w,t+h); g.addColorStop(0,'rgba(60,201,255,.55)'); g.addColorStop(1,'rgba(67,227,173,.25)');
  x.lineWidth = 2; x.strokeStyle = g; x.stroke(); x.restore();
}
function stats(x, itens, y){
  const gap = 22, w = (W-160-gap*2)/3, h = 200;
  itens.forEach(([v,l],i)=>{
    const lft = 80 + i*(w+gap);
    painel(x, lft, y, w, h);
    x.textAlign = 'center';
    x.font = `400 ${v.length>8?78:96}px ${DISPLAY}`; x.fillStyle = COR.ink; x.fillText(v, lft+w/2, y+116);
    x.font = `800 22px ${BODY}`; x.fillStyle = COR.muted; espacado(x, l, lft+w/2, y+164, 4);
  });
}
// barras de intensidade (1 a 4) dentro do terceiro painel das estatísticas
function intensidade(x, n, y){
  const gap = 22, w = (W-160-gap*2)/3, lft = 80 + 2*(w+gap);
  const bw = 34, esp = 14, total = bw*4 + esp*3, x0 = lft + (w-total)/2, base = y + 126;
  for(let i=0;i<4;i++){
    const h = 34 + i*20, px = x0 + i*(bw+esp);
    rr(x, px, base-h, bw, h, 8);
    if(i < n){ x.save(); x.shadowColor = 'rgba(67,227,173,.7)'; x.shadowBlur = 16; const g = x.createLinearGradient(0, base-h, 0, base); g.addColorStop(0, i>=3 ? '#ffd166' : '#7ff5cf'); g.addColorStop(1, i>=3 ? '#ff8a3d' : '#2fcf98'); x.fillStyle = g; x.fill(); x.restore(); }
    else { x.lineWidth = 3; x.strokeStyle = COR.line; x.stroke(); }
  }
}
function check(x, cx, cy, r, cor){
  x.strokeStyle = cor; x.lineWidth = r*0.2; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(cx - r*0.4, cy + r*0.02); x.lineTo(cx - r*0.1, cy + r*0.32); x.lineTo(cx + r*0.42, cy - r*0.28); x.stroke();
}
function semana(x, dias, y){
  const r = 52, passo = (W-160)/7;
  dias.forEach((dia,i)=>{
    const cx = 80 + passo*i + passo/2;
    x.beginPath(); x.arc(cx, y, r, 0, Math.PI*2);
    if(dia.feito){
      x.save(); x.shadowColor = 'rgba(67,227,173,.75)'; x.shadowBlur = 30;
      const g = x.createLinearGradient(cx, y-r, cx, y+r); g.addColorStop(0,'#7ff5cf'); g.addColorStop(1,'#2fcf98');
      x.fillStyle = g; x.fill(); x.restore();
      check(x, cx, y, r, '#03140e');
    } else {
      if(!dia.futuro){ x.fillStyle = 'rgba(13,30,38,.6)'; x.fill(); }
      x.lineWidth = 4; x.strokeStyle = dia.futuro ? COR.dim : COR.line; x.stroke();
    }
    if(dia.hoje && !dia.feito){ x.beginPath(); x.arc(cx, y, r+10, 0, Math.PI*2); x.lineWidth = 3; x.strokeStyle = COR.cyan; x.stroke(); }
    x.textAlign = 'center'; x.font = `800 30px ${BODY}`; x.fillStyle = dia.feito ? COR.ink : COR.soft;
    x.fillText(dia.label, cx, y + r + 50);
  });
}
function destaqueNumero(x, n, linha1, linha2, y){
  x.textAlign = 'left'; x.font = `400 260px ${DISPLAY}`;
  x.save(); x.shadowColor = 'rgba(67,227,173,.55)'; x.shadowBlur = 40; x.fillStyle = gradTxt(x, y-190, y); x.fillText(String(n), 80, y); x.restore();
  const wn = x.measureText(String(n)).width;
  const livre = W - 80 - (80 + wn + 34);
  const caber = t=>{ let sz = 86; x.font = `400 ${sz}px ${DISPLAY}`; while(x.measureText(t).width > livre && sz > 50){ sz -= 4; x.font = `400 ${sz}px ${DISPLAY}`; } };
  caber(linha1); x.fillStyle = COR.ink; x.fillText(linha1, 80 + wn + 34, y - 96);
  caber(linha2); x.fillStyle = COR.muted; x.fillText(linha2, 80 + wn + 34, y - 10);
}
function perfil(x, d, y){
  const nome = d.nome || '', insta = d.insta ? '@'+d.insta : '';
  if(!nome && !insta && !d.foto) return;
  const R = 50;
  painel(x, 80, y-80, W-160, 160);
  let px = 120;
  if(d.foto){
    const cx = px + R, cy = y;
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2); x.clip();
    const s = Math.min(d.foto.width, d.foto.height);
    x.drawImage(d.foto, (d.foto.width-s)/2, (d.foto.height-s)/2, s, s, cx-R, cy-R, R*2, R*2);
    x.restore();
    x.beginPath(); x.arc(cx, cy, R+4, 0, Math.PI*2); x.lineWidth = 5; x.strokeStyle = COR.mint; x.stroke();
    px += R*2 + 30;
  }
  x.textAlign = 'left';
  if(insta){
    x.font = `800 38px ${BODY}`; x.fillStyle = COR.ink; x.fillText(nome, px, y - 6);
    x.font = `700 32px ${BODY}`; x.fillStyle = COR.cyan; x.fillText(insta, px, y + 38);
  } else {
    x.font = `800 40px ${BODY}`; x.fillStyle = COR.ink; x.fillText(nome, px, y + 14);
  }
  x.textAlign = 'right'; x.font = `400 44px ${DISPLAY}`; x.fillStyle = COR.mint; x.fillText('NO FOCO', W-120, y + 14);
}

// faixa "NOVA CONQUISTA" entre os números e a semana
function estrela(x, cx, cy, r){
  x.beginPath();
  for(let i=0;i<10;i++){ const a = -Math.PI/2 + i*Math.PI/5, rr2 = i%2 ? r*0.45 : r; x.lineTo(cx + Math.cos(a)*rr2, cy + Math.sin(a)*rr2); }
  x.closePath(); x.fill();
}
function selo(x, nome, t){
  const h = 50;
  x.save();
  rr(x, 80, t, W-160, h, h/2);
  const g = x.createLinearGradient(80, t, W-80, t); g.addColorStop(0,'rgba(255,196,70,.24)'); g.addColorStop(1,'rgba(67,227,173,.14)');
  x.fillStyle = g; x.fill(); x.lineWidth = 2; x.strokeStyle = 'rgba(255,206,92,.85)'; x.stroke();
  x.fillStyle = '#ffd25c'; estrela(x, 122, t+h/2, 17);
  x.textAlign = 'left'; x.font = `800 24px ${BODY}`; x.fillStyle = '#ffd25c';
  const px = espacado(x, 'NOVA CONQUISTA', 156, t+h/2+9, 3, 'left') + 22;
  let txt = String(nome).toUpperCase();
  x.font = `800 26px ${BODY}`; x.fillStyle = COR.ink;
  while(x.measureText(txt).width > W-120-px-20 && txt.length>4) txt = txt.slice(0,-2)+'…';
  x.fillText(txt, px, t+h/2+10);
  x.restore();
}

/* ---------- semana ---------- */
export async function desenharSemana(d){
  await fontes();
  const [c, x] = base();
  const s = d.ref;
  const cardio = s && s.letter==='CARDIO', cd = cardio ? ((s.ex||[])[0]||{}).cardio || {} : null;
  const aula = cardio && (cd.aula || s.wname==='Spinning' || s.wname==='Jump' || s.wname==='Pump');
  if(aula && s.wname!=='Pump') equipamentoAula(x, s.wname); else equipamento(x);
  marca(x, d.data);
  rotulo(x, s ? (aula ? 'AULA CONCLUÍDA' : cardio ? 'CARDIO CONCLUÍDO' : 'TREINO CONCLUÍDO') : 'MINHA SEMANA', 400);
  x.textAlign = 'left'; x.font = `400 230px ${DISPLAY}`; x.fillStyle = COR.ink;
  x.fillText(s ? (aula ? String(s.wname).toUpperCase() : cardio ? 'CARDIO' : 'TREINO '+String(s.letter||'')) : 'SEMANA', 72, 610);
  const sub = s ? (aula ? (cd.intens ? 'INTENSIDADE '+String(cd.intens).toUpperCase() : 'AULA') : String(s.wname||'').toUpperCase().slice(0,22)) : 'DE TREINO';
  let fs = 120; x.font = `400 ${fs}px ${DISPLAY}`; while(x.measureText(sub).width > W-160 && fs > 70){ fs -= 6; x.font = `400 ${fs}px ${DISPLAY}`; }
  x.fillStyle = gradTxt(x, 630, 740);
  x.fillText(sub, 76, 732);
  if(aula){
    const NIV = { leve:1, moderada:2, forte:3, 'muito forte':4 };
    stats(x, [[tempoTxt(s.dur), 'TEMPO'], [cd.kcal ? (cd.kcalEst?'~':'')+Math.round(cd.kcal)+' kcal' : '—', cd.kcalEst ? 'KCAL ESTIMADAS' : 'CALORIAS'], ['', 'INTENSIDADE']], 790);
    intensidade(x, NIV[cd.intens] || 0, 790);
  } else stats(x, cardio
    ? [[tempoTxt(s.dur), 'TEMPO'], [cd.km ? String(cd.km).replace('.',',')+' km' : '—', 'DISTÂNCIA'], [cd.kcal ? Math.round(cd.kcal)+' kcal' : '—', 'CALORIAS']]
    : s
    ? [[tempoTxt(s.dur), 'TEMPO'], [s.done+'/'+s.total, 'SÉRIES'], [Math.floor(s.vol||0).toLocaleString('pt-BR')+' kg', 'VOLUME']]
    : [[String(d.treinosSemana), d.treinosSemana===1?'TREINO':'TREINOS'], [tempoTxt(d.tempoSemana), 'TEMPO'], [Math.floor(d.volSemana||0).toLocaleString('pt-BR')+' kg', 'VOLUME']], 790);
  if(d.conquista) selo(x, d.conquista, 1008);
  rotulo(x, 'SEMANA', d.conquista ? 1104 : 1090, COR.cyan);
  semana(x, d.dias, 1180);
  destaqueNumero(x, d.nDias, d.nDias===1?'DIA DE TREINO':'DIAS DE TREINO', 'NESTA SEMANA', 1500);
  perfil(x, d, 1592);
  return c;
}

/* ---------- mês ---------- */
export async function desenharMes(d){
  await fontes();
  const [c, x] = base();
  equipamento(x);
  marca(x, d.data);
  rotulo(x, 'RESUMO DO MÊS', 400);
  x.textAlign = 'left'; x.font = `400 210px ${DISPLAY}`; x.fillStyle = COR.ink; x.fillText(MESES[d.mes].toUpperCase(), 72, 590);
  x.font = `400 86px ${DISPLAY}`; x.fillStyle = gradTxt(x, 610, 690); x.fillText(String(d.ano), 78, 682);
  const passo = (W-160)/7, x0 = 80;
  x.font = `800 24px ${BODY}`; x.fillStyle = COR.muted;
  ['SEG','TER','QUA','QUI','SEX','SÁB','DOM'].forEach((t,i)=> espacado(x, t, x0 + passo*i + passo/2, 760, 3));
  const primeiro = new Date(d.ano, d.mes, 1);
  const off = (primeiro.getDay()+6)%7;
  const total = new Date(d.ano, d.mes+1, 0).getDate();
  const linhas = Math.ceil((off + total)/7);
  const alt = linhas > 5 ? 86 : 100, r = linhas > 5 ? 36 : 40, y0 = 820;
  const hoje = new Date();
  for(let dia=1; dia<=total; dia++){
    const pos = off + dia - 1, col = pos%7, lin = Math.floor(pos/7);
    const cx = x0 + passo*col + passo/2, cy = y0 + lin*alt;
    const feito = d.feitos.has(dia), futuro = new Date(d.ano, d.mes, dia) > hoje;
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI*2);
    if(feito){
      x.save(); x.shadowColor = 'rgba(67,227,173,.7)'; x.shadowBlur = 22;
      const g = x.createLinearGradient(cx, cy-r, cx, cy+r); g.addColorStop(0,'#7ff5cf'); g.addColorStop(1,'#2fcf98');
      x.fillStyle = g; x.fill(); x.restore();
    } else if(!futuro){ x.fillStyle = 'rgba(13,30,38,.75)'; x.fill(); x.lineWidth = 2; x.strokeStyle = COR.line; x.stroke(); }
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `${feito?800:600} 32px ${BODY}`; x.fillStyle = feito ? '#03140e' : (futuro ? COR.dim : COR.muted);
    x.fillText(String(dia), cx, cy+1);
    x.textBaseline = 'alphabetic';
  }
  destaqueNumero(x, d.nDias, d.nDias===1?'DIA DE TREINO':'DIAS DE TREINO', `${tempoTxt(d.tempo)} · ${d.treinos} ${d.treinos===1?'TREINO':'TREINOS'}`.toUpperCase(), 1500);
  perfil(x, d, 1592);
  return c;
}

/* ---------- conquista / nível ---------- */
const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
function quebrar(x, txt, larg){
  const palavras = String(txt||'').split(/\s+/), linhas = []; let atual = '';
  palavras.forEach(p=>{ const t = atual ? atual+' '+p : p; if(x.measureText(t).width > larg && atual){ linhas.push(atual); atual = p; } else atual = t; });
  if(atual) linhas.push(atual); return linhas;
}
function medalha(x, cx, cy, R, d){
  x.save();
  // raios de luz
  x.translate(cx, cy);
  for(let i=0;i<24;i++){ x.rotate(Math.PI/12); const g = x.createLinearGradient(0,0,0,-R*1.9); g.addColorStop(0,'rgba(255,210,92,.20)'); g.addColorStop(1,'rgba(255,210,92,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(-14,0); x.lineTo(0,-R*1.9); x.lineTo(14,0); x.closePath(); x.fill(); }
  x.restore();
  x.save(); x.shadowColor = 'rgba(255,196,70,.55)'; x.shadowBlur = 70;
  const anel = x.createLinearGradient(cx-R, cy-R, cx+R, cy+R); anel.addColorStop(0,'#ffe28a'); anel.addColorStop(.5,'#ffb43c'); anel.addColorStop(1,'#ffe9a8');
  x.fillStyle = anel; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2); x.fill(); x.restore();
  const dentro = x.createRadialGradient(cx, cy-R*0.3, R*0.1, cx, cy, R*0.86); dentro.addColorStop(0,'#16323d'); dentro.addColorStop(1,'#071219');
  x.fillStyle = dentro; x.beginPath(); x.arc(cx, cy, R*0.86, 0, Math.PI*2); x.fill();
  x.lineWidth = 4; x.strokeStyle = 'rgba(255,226,138,.55)'; x.beginPath(); x.arc(cx, cy, R*0.80, 0, Math.PI*2); x.stroke();
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if(d.nivel){
    x.font = `400 ${R*1.05}px ${DISPLAY}`; x.fillStyle = '#ffd25c'; x.fillText(String(d.nivelNum||''), cx, cy+R*0.06);
  } else {
    x.font = `${Math.round(R*0.95)}px ${EMOJI}`; x.fillStyle = '#fff'; x.fillText(d.ico || '🏆', cx, cy+R*0.04);
  }
  x.textBaseline = 'alphabetic';
  // estrelinhas
  x.fillStyle = '#ffd25c'; [[-1.25,-0.55,16],[1.3,-0.35,12],[1.05,0.9,10],[-1.1,0.95,13]].forEach(([a,b,r])=>estrela(x, cx+a*R, cy+b*R, r));
}
export async function desenharConquista(d){
  await fontes();
  const [c, x] = base();
  equipamento(x);
  marca(x, d.data);
  rotulo(x, d.nivel ? 'NOVO NÍVEL ALCANÇADO' : 'CONQUISTA DESBLOQUEADA', 400, '#ffd25c');
  medalha(x, W/2, 700, 210, d);
  x.textAlign = 'center';
  let tam = 150; x.font = `400 ${tam}px ${DISPLAY}`;
  const titulo = String(d.titulo||'').toUpperCase();
  while(x.measureText(titulo).width > W-140 && tam > 80){ tam -= 6; x.font = `400 ${tam}px ${DISPLAY}`; }
  x.save(); x.shadowColor = 'rgba(255,196,70,.35)'; x.shadowBlur = 30; x.fillStyle = COR.ink; x.fillText(titulo, W/2, 1080); x.restore();
  x.font = `600 38px ${BODY}`; x.fillStyle = COR.muted;
  quebrar(x, d.desc, W-200).slice(0,2).forEach((l,i)=>x.fillText(l, W/2, 1150 + i*50));
  const nDesc = Math.min(2, quebrar(x, d.desc, W-200).length);
  x.textAlign = 'center'; x.font = `700 28px ${BODY}`; x.fillStyle = '#ffd25c';
  espacado(x, (d.nivel ? 'ALCANÇADO EM ' : 'CONQUISTADA EM ') + dataBR(d.data), W/2, 1150 + nDesc*50 + 30, 4);
  stats(x, [[d.feitas+'/'+d.total, 'CONQUISTAS'], [String(d.nivelNome||'').toUpperCase(), 'NÍVEL'], [String(d.treinos), d.treinos===1?'TREINO':'TREINOS']], 1300);
  perfil(x, d, 1610);
  return c;
}

/* ---------- antes e depois ---------- */
function capa(x, img, l, t, w, h, r){
  x.save(); rr(x, l, t, w, h, r); x.clip();
  if(img){
    const s = Math.max(w/img.width, h/img.height), iw = img.width*s, ih = img.height*s;
    x.drawImage(img, l+(w-iw)/2, t+(h-ih)/2, iw, ih);
  } else { x.fillStyle = '#0d1d25'; x.fillRect(l, t, w, h); }
  const g = x.createLinearGradient(0, t+h*0.62, 0, t+h); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.78)');
  x.fillStyle = g; x.fillRect(l, t, w, h);
  x.restore();
  x.save(); rr(x, l, t, w, h, r); x.lineWidth = 3; x.strokeStyle = 'rgba(60,201,255,.45)'; x.stroke(); x.restore();
}
export async function desenharAntesDepois(d){
  await fontes();
  const [c, x] = base();
  marca(x, d.data);
  rotulo(x, 'MINHA EVOLUÇÃO', 400);
  x.textAlign = 'left'; x.font = `400 150px ${DISPLAY}`; x.fillStyle = COR.ink; x.fillText('ANTES', 72, 545);
  const wA = x.measureText('ANTES ').width;
  x.fillStyle = gradTxt(x, 420, 545); x.fillText('& DEPOIS', 72 + wA, 545);
  const gap = 24, w = (W-160-gap)/2, h = w*1.5, t = 590;
  [[d.antes, d.fotoA, 80], [d.depois, d.fotoB, 80+w+gap]].forEach(([info, img, l], i)=>{
    capa(x, img, l, t, w, h, 28);
    x.textAlign = 'left';
    x.font = `400 64px ${DISPLAY}`; x.fillStyle = i ? COR.mint : COR.ink; x.fillText(i ? 'DEPOIS' : 'ANTES', l+26, t+h-62);
    x.font = `700 28px ${BODY}`; x.fillStyle = 'rgba(242,248,249,.85)'; x.fillText(dataBR(info.ts), l+26, t+h-24);
    if(info.kg!=null){ x.textAlign = 'right'; x.font = `400 54px ${DISPLAY}`; x.fillStyle = COR.ink; x.fillText(String(info.kg).replace('.',',')+' KG', l+w-24, t+h-24); }
  });
  const itens = [[String(d.dias), d.dias===1?'DIA':'DIAS']];
  if(d.difKg!=null) itens.push([(d.difKg>0?'+':'')+String(d.difKg).replace('.',',')+' kg', 'PESO']);
  if(d.difGord!=null) itens.push([(d.difGord>0?'+':'')+String(d.difGord).replace('.',',')+'%', 'GORDURA']);
  if(itens.length<3) itens.push([String(d.treinos), d.treinos===1?'TREINO':'TREINOS']);
  if(itens.length<3) itens.push([d.pose.toUpperCase(), 'POSE']);
  stats(x, itens.slice(0,3), t+h+28);
  perfil(x, d, 1610);
  return c;
}

/* ---------- retrospectiva do ano ---------- */
export async function desenharRetrospectiva(d){
  await fontes();
  const [c, x] = base();
  equipamento(x);
  marca(x, d.data);
  rotulo(x, 'RETROSPECTIVA', 400);
  x.textAlign = 'left'; x.font = `400 260px ${DISPLAY}`;
  x.save(); x.shadowColor = 'rgba(67,227,173,.45)'; x.shadowBlur = 40; x.fillStyle = gradTxt(x, 420, 640); x.fillText(String(d.ano), 66, 640); x.restore();
  // número principal
  x.font = `400 210px ${DISPLAY}`; x.fillStyle = COR.ink; x.fillText(String(d.treinos), 72, 860);
  const wn = x.measureText(String(d.treinos)).width;
  x.font = `400 70px ${DISPLAY}`; x.fillStyle = COR.ink; x.fillText(d.treinos===1?'TREINO':'TREINOS', 72+wn+30, 790);
  x.fillStyle = COR.muted; x.fillText(d.dias+' DIAS NA ACADEMIA', 72+wn+30, 858);
  stats(x, [[d.horas, 'HORAS'], [d.toneladas, 'TONELADAS'], [d.seq+' sem', 'SEQUÊNCIA']], 920);
  // destaques
  const linhas = [
    ['EXERCÍCIO FAVORITO', d.favorito ? d.favorito.nome+' · '+d.favorito.vezes+'x' : '—'],
    ['MAIOR EVOLUÇÃO', d.evolucao ? d.evolucao.nome+' · +'+String(d.evolucao.kg).replace('.',',')+' kg' : '—'],
    ['MÊS MAIS FORTE', d.mes ? d.mes.nome+' · '+d.mes.dias+' dias' : '—'],
    ['CONQUISTAS NO ANO', String(d.conquistas)+(d.cardio ? '   ·   CARDIOS: '+d.cardio : '')]
  ];
  let y = 1190;
  linhas.forEach(([k, v])=>{
    x.textAlign = 'left'; x.font = `800 22px ${BODY}`; x.fillStyle = COR.mint; espacado(x, k, 80, y, 4, 'left');
    x.font = `800 40px ${BODY}`; x.fillStyle = COR.ink;
    let t = v; while(x.measureText(t).width > W-160 && t.length>6) t = t.slice(0,-2)+'…';
    x.fillText(t, 80, y+50); y += 88;
  });
  perfil(x, d, 1610);
  return c;
}
