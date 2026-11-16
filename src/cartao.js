// Imagens para compartilhar (1080 x 1350, formato do feed e bom para story).

const W = 1080, H = 1350;
const COR = { bg:'#050a0e', panel:'#0d1b22', line:'#1d3a46', ink:'#ecf5f7', muted:'#8ca2ab', cyan:'#3cc9ff', mint:'#43e3ad', dim:'#3c525b' };
const FONTE = 'Montserrat, "Arial Black", system-ui, sans-serif';
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

async function fontes(){
  try{ await Promise.all(['900 80px Montserrat','800 60px Montserrat','700 40px Montserrat','600 30px Montserrat'].map(f=>document.fonts.load(f))); }catch(e){}
}
function pad(n){ return String(n).padStart(2,'0'); }
function dataBR(ts){ const d = new Date(ts); return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear(); }
export function tempoTxt(seg){
  const m = Math.max(0, Math.floor((seg||0)/60));
  if(m < 60) return m+' min';
  const h = Math.floor(m/60), r = m%60;
  return r ? h+' h '+r+' min' : h+' h';
}

function base(){
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = COR.bg; x.fillRect(0,0,W,H);
  let g = x.createRadialGradient(80,0,0,80,0,900); g.addColorStop(0,'rgba(28,110,160,.45)'); g.addColorStop(1,'rgba(28,110,160,0)');
  x.fillStyle = g; x.fillRect(0,0,W,H);
  g = x.createRadialGradient(W,H,0,W,H,900); g.addColorStop(0,'rgba(30,140,110,.32)'); g.addColorStop(1,'rgba(30,140,110,0)');
  x.fillStyle = g; x.fillRect(0,0,W,H);
  // moldura
  x.strokeStyle = COR.line; x.lineWidth = 3; roundRect(x, 24, 24, W-48, H-48, 44); x.stroke();
  return [c, x];
}
function roundRect(x, l, t, w, h, r){ x.beginPath(); x.moveTo(l+r,t); x.arcTo(l+w,t,l+w,t+h,r); x.arcTo(l+w,t+h,l,t+h,r); x.arcTo(l,t+h,l,t,r); x.arcTo(l,t,l+w,t,r); x.closePath(); }
function cabecalho(x, ts){
  x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  x.font = `900 46px ${FONTE}`;
  x.save(); x.shadowColor = 'rgba(60,201,255,.8)'; x.shadowBlur = 14; x.strokeStyle = COR.cyan; x.lineWidth = 2.4; x.strokeText('MEUS', 80, 128); x.restore();
  const w = x.measureText('MEUS ').width;
  x.fillStyle = COR.mint; x.fillText('TREINOS', 80 + w, 128);
  x.textAlign = 'right'; x.font = `600 38px ${FONTE}`; x.fillStyle = COR.muted; x.fillText(dataBR(ts), W-80, 126);
}
function texto(x, txt, cx, y, font, cor, align='center'){ x.font = font; x.fillStyle = cor; x.textAlign = align; x.fillText(txt, cx, y); }
// frase com partes coloridas, centralizada
function rico(x, partes, cx, y, font){
  x.font = font; x.textAlign = 'left';
  const total = partes.reduce((n,[t])=>n + x.measureText(t).width, 0);
  let px = cx - total/2;
  partes.forEach(([t,c])=>{ x.fillStyle = c; x.fillText(t, px, y); px += x.measureText(t).width; });
}
function check(x, cx, cy, r, cor){
  x.strokeStyle = cor; x.lineWidth = r*0.22; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(cx - r*0.42, cy + r*0.02); x.lineTo(cx - r*0.1, cy + r*0.34); x.lineTo(cx + r*0.45, cy - r*0.3); x.stroke();
}
function rodapeNome(x, nome, y){
  if(!nome) return;
  texto(x, nome, W/2, y, `700 36px ${FONTE}`, COR.cyan);
}

export async function desenharSemana(d){
  await fontes();
  const [c, x] = base();
  cabecalho(x, d.data);
  const s = d.ref;
  // destaque central
  if(s){
    x.save(); x.font = `900 250px ${FONTE}`; x.textAlign = 'center'; x.lineWidth = 5; x.strokeStyle = COR.cyan;
    x.shadowColor = 'rgba(60,201,255,.75)'; x.shadowBlur = 30; x.strokeText(String(s.letter||'').slice(0,2), W/2, 450); x.restore();
    texto(x, 'Treino concluído!', W/2, 560, `800 66px ${FONTE}`, COR.ink);
    texto(x, String(s.wname||'').toUpperCase(), W/2, 622, `800 36px ${FONTE}`, COR.mint);
  } else {
    texto(x, 'Minha semana', W/2, 420, `900 92px ${FONTE}`, COR.ink);
    texto(x, 'DE TREINO', W/2, 490, `800 40px ${FONTE}`, COR.mint);
  }
  // números
  const stats = s
    ? [[tempoTxt(s.dur), 'TEMPO'], [s.done+'/'+s.total, 'SÉRIES'], [Math.floor(s.vol||0).toLocaleString('pt-BR')+' kg', 'VOLUME']]
    : [[String(d.treinosSemana), d.treinosSemana===1?'TREINO':'TREINOS'], [tempoTxt(d.tempoSemana), 'TEMPO TOTAL'], [Math.floor(d.volSemana||0).toLocaleString('pt-BR')+' kg', 'VOLUME']];
  const yS = s ? 735 : 640;
  stats.forEach(([v,l],i)=>{
    const cx = 200 + i*340;
    texto(x, v, cx, yS, `900 ${v.length>8?44:52}px ${FONTE}`, COR.ink);
    texto(x, l, cx, yS+46, `700 24px ${FONTE}`, COR.muted);
  });
  // semana
  const yC = s ? 930 : 860, r = 54, passo = (W-160)/7;
  d.dias.forEach((dia,i)=>{
    const cx = 80 + passo*i + passo/2;
    x.beginPath(); x.arc(cx, yC, r, 0, Math.PI*2);
    if(dia.feito){
      x.save(); x.shadowColor = 'rgba(67,227,173,.6)'; x.shadowBlur = 22; x.fillStyle = COR.mint; x.fill(); x.restore();
      check(x, cx, yC, r, '#03140e');
    } else {
      x.lineWidth = 5; x.strokeStyle = dia.futuro ? COR.dim : COR.line; x.stroke();
    }
    if(dia.hoje && !dia.feito){ x.beginPath(); x.arc(cx, yC, r+9, 0, Math.PI*2); x.lineWidth = 3; x.strokeStyle = COR.cyan; x.stroke(); }
    texto(x, dia.label, cx, yC + r + 52, `800 34px ${FONTE}`, dia.feito ? COR.ink : COR.muted);
  });
  // frase
  const n = d.nDias;
  rico(x, [['Você treinou ', COR.ink], [String(n), COR.mint], [n===1?' dia essa semana':' dias essa semana', COR.ink]], W/2, s ? 1170 : 1110, `800 50px ${FONTE}`);
  rodapeNome(x, d.nome, s ? 1250 : 1200);
  return c;
}

export async function desenharMes(d){
  await fontes();
  const [c, x] = base();
  cabecalho(x, d.data);
  texto(x, MESES[d.mes], W/2, 250, `900 72px ${FONTE}`, COR.ink);
  const dias = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const passo = (W-160)/7, x0 = 80;
  dias.forEach((t,i)=> texto(x, t, x0 + passo*i + passo/2, 335, `700 32px ${FONTE}`, COR.muted));
  const primeiro = new Date(d.ano, d.mes, 1);
  const off = (primeiro.getDay()+6)%7;
  const total = new Date(d.ano, d.mes+1, 0).getDate();
  const linhas = Math.ceil((off + total)/7);
  const alt = linhas > 5 ? 112 : 128, r = linhas > 5 ? 46 : 50, y0 = 410;
  const hoje = new Date();
  for(let dia=1; dia<=total; dia++){
    const pos = off + dia - 1, col = pos%7, lin = Math.floor(pos/7);
    const cx = x0 + passo*col + passo/2, cy = y0 + lin*alt;
    const feito = d.feitos.has(dia);
    const futuro = new Date(d.ano, d.mes, dia) > hoje;
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI*2);
    if(feito){ x.save(); x.shadowColor = 'rgba(67,227,173,.55)'; x.shadowBlur = 18; x.fillStyle = COR.mint; x.fill(); x.restore(); }
    else if(!futuro){ x.fillStyle = COR.panel; x.fill(); }
    x.textBaseline = 'middle';
    texto(x, String(dia), cx, cy+2, `${feito?800:600} 36px ${FONTE}`, feito ? '#03140e' : (futuro ? COR.dim : COR.muted));
    x.textBaseline = 'alphabetic';
  }
  const n = d.nDias;
  rico(x, [['Você treinou ', COR.ink], [String(n), COR.mint], [n===1?' dia esse mês':' dias esse mês', COR.ink]], W/2, 1170, `800 50px ${FONTE}`);
  texto(x, `${tempoTxt(d.tempo)} de treino · ${d.treinos} ${d.treinos===1?'treino':'treinos'}`, W/2, 1222, `600 32px ${FONTE}`, COR.muted);
  rodapeNome(x, d.nome, 1276);
  return c;
}
