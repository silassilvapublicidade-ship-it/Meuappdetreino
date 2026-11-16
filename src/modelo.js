// Ficha modelo (A–E), catálogo de medidas e conversões de ficha.

export const LETRAS = ['A','B','C','D','E','F','G'];
export const DIAS = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
export const SEMANA = [1,2,3,4,5,6,0];
export const WD = {1:'Seg',2:'Ter',3:'Qua',4:'Qui',5:'Sex',6:'Sáb',0:'Dom'};

// inc = degrau de carga da sugestão (kg). Bi-set: um valor por exercício. 0 = peso do corpo.
export const FICHA_MODELO = {
  nome: 'Hipertrofia e definição A–E',
  order: ['A','B','C','D','E'],
  w: {
    A:{name:'Superior 1', focus:'Empurrar e Largura', rest:'60–90s', ex:[
      {n:'Supino inclinado com halteres', s:4, r:[8,10], rest:90, inc:2, tip:'Banco a 30°–45° · Cotovelos levemente fechados.'},
      {n:'Puxada frontal na polia (aberta)', s:4, r:[8,12], rest:90, inc:5, tip:'Puxe até a parte alta do peito, estufando o tórax.'},
      {n:'Desenvolvimento com halteres (sentado)', s:3, r:[10,12], rest:75, inc:2, tip:'Cotovelos um pouco à frente dos ombros. Não bata os halteres.'},
      {n:'Remada baixa na polia (triângulo)', s:3, r:[10,12], rest:75, inc:5, tip:'Coluna neutra · Puxe o triângulo em direção ao umbigo.'},
      {n:'Elevação lateral com halteres', s:3, r:[12,15], rest:60, inc:1, tip:'Eleve os braços até a linha dos ombros, cotovelos semiflexionados.'},
      {n:'Tríceps corda + Rosca direta W', parts:['Tríceps corda','Rosca direta W'], s:3, r:[10,12], rest:60, inc:[2.5,2], tip:'Cotovelos travados ao lado do corpo · Faça os dois sem descanso.'}
    ]},
    B:{name:'Inferior 1', focus:'Quadríceps e Core', rest:'60–120s', ex:[
      {n:'Agachamento livre (ou Smith)', s:4, r:[8,10], rest:120, inc:4, tip:'Abdômen travado · Desça alinhando joelhos com a ponta dos pés.'},
      {n:'Leg press 45°', s:3, r:[10,12], rest:90, inc:10, tip:'Pés na largura dos ombros · Não tire a lombar nem o quadril do apoio.'},
      {n:'Cadeira extensora', s:3, r:[12,15], rest:60, inc:5, tip:'Joelho alinhado com o eixo da máquina · Segure 1s no topo.'},
      {n:'Mesa flexora', s:3, r:[10,12], rest:75, inc:5, tip:'Mantenha o quadril bem pressionado contra o banco.'},
      {n:'Panturrilha em pé na máquina', s:4, r:[12,15], rest:60, inc:5, tip:'Amplitude máxima · Alongue embaixo e suba até a ponta dos pés.'},
      {n:'Abdominal supra na polia (ajoelhado)', s:3, r:[12,15], rest:60, inc:5, tip:'Enrole a coluna em direção às coxas, sem puxar com os braços.'}
    ]},
    C:{name:'Superior 2', focus:'Costas, Ombros e Braços', rest:'60–90s', ex:[
      {n:'Remada curvada com barra', s:4, r:[8,10], rest:90, inc:2, tip:'Tronco inclinado a ~45° com coluna reta · Puxe a barra na direção da cintura.'},
      {n:'Supino reto na máquina', s:3, r:[8,12], rest:90, inc:5, tip:'Manoplas alinhadas com o meio do peito · Ombros baixos.'},
      {n:'Puxada na polia (pegada neutra)', s:3, r:[10,12], rest:75, inc:5, tip:'Palmas voltadas uma para a outra · Puxe os cotovelos para baixo.'},
      {n:'Crucifixo inverso na máquina', s:3, r:[12,15], rest:60, inc:5, tip:'Peito apoiado no encosto · Foco na parte posterior dos ombros.'},
      {n:'Elevação lateral na polia', s:3, r:[12,15], rest:60, inc:2.5, tip:'Cabo à frente ou atrás do corpo · Tensão constante.'},
      {n:'Tríceps francês + Rosca', parts:['Tríceps francês','Rosca'], s:3, r:[10,12], rest:60, inc:[2,2], tip:'Cotovelos apontados para cima e para frente · Estenda totalmente.'}
    ]},
    D:{name:'Inferior 2', focus:'Posterior, Glúteos e Core', rest:'60–90s', ex:[
      {n:'Elevação pélvica (máquina ou barra)', s:4, r:[8,12], rest:90, inc:10, tip:'Pés firmes na largura dos ombros · Segure 1s contraindo o glúteo no topo.'},
      {n:'Cadeira flexora', s:4, r:[10,12], rest:75, inc:5, tip:'Trave a almofada sobre as coxas e puxe o rolo até o máximo de flexão.'},
      {n:'Afundo búlgaro com halteres', s:3, r:[10,12], rest:90, inc:2, tip:'Pé de trás apoiado no banco · Desça verticalmente com o joelho estável.'},
      {n:'Cadeira abdutora', s:3, r:[12,15], rest:60, inc:5, tip:'Abra as pernas de forma controlada · Segure 1s aberto e retorne devagar.'},
      {n:'Panturrilha sentado', s:4, r:[12,15], rest:60, inc:5, tip:'Controle a descida por 2 segundos para evitar impulso do tendão.'},
      {n:'Elevação de pernas (abdômen)', s:3, r:[12,15], rest:60, inc:0, tip:'Suba as pernas girando levemente a pelve para cima, sem balançar.'}
    ]},
    E:{name:'Full Body', focus:'Corpo inteiro e Definição', rest:'60–90s', ex:[
      {n:'Leg press horizontal', s:3, r:[10,12], rest:90, inc:10, tip:'Lombar totalmente apoiada no encosto · Empurre sem travar os joelhos.'},
      {n:'Crucifixo na máquina (peck deck)', s:3, r:[12,15], rest:60, inc:5, tip:'Cotovelos na linha dos ombros · Feche segurando 1s no centro do peito.'},
      {n:'Pullover na polia com corda', s:3, r:[12,15], rest:60, inc:2.5, tip:'Tronco levemente inclinado · Puxe a corda até a coxa com braços quase estendidos.'},
      {n:'Cadeira flexora', s:3, r:[12,15], rest:75, inc:5, tip:'Costas firmes no encosto · Puxe o rolo até o máximo e controle a volta.'},
      {n:'Elevação lateral na máquina', s:3, r:[12,15], rest:60, inc:5, tip:'Ombros baixos e relaxados · Eleve os cotovelos até a linha dos ombros.'},
      {n:'Rosca martelo + Tríceps coice', parts:['Rosca martelo','Tríceps coice'], s:3, r:[12,12], rest:60, inc:[2,1], tip:'Pegada neutra na rosca e cotovelo fixo no coice · Faça em bi-set sem descanso.'}
    ]}
  },
  // chave = dia da semana (0 = domingo). Valores: letra do treino, 'ativo' (descanso ativo) ou 'total' (descanso total)
  sched: {1:'A',2:'B',3:'ativo',4:'C',5:'D',6:'E',0:'total'}
};

// ---------- Medidas da avaliação ----------
export const MKEYS = {
  peso:['Peso','kg'], altura:['Altura','cm'], imc:['IMC',''], gordura_pct:['% de gordura','%'], massa_gorda:['Massa gorda','kg'],
  massa_magra:['Massa magra','kg'], massa_muscular:['Massa muscular','kg'], agua_pct:['Água corporal','%'], gordura_visceral:['Gordura visceral',''],
  tmb:['Metabolismo basal','kcal'], idade_metabolica:['Idade metabólica','anos'],
  pescoco:['Pescoço','cm'], ombro:['Ombros','cm'], torax:['Tórax','cm'], cintura:['Cintura','cm'], abdomen:['Abdômen','cm'], quadril:['Quadril','cm'],
  braco_relaxado:['Braço relaxado','cm'], braco_d_relaxado:['Braço dir. relaxado','cm'], braco_e_relaxado:['Braço esq. relaxado','cm'],
  braco_contraido:['Braço contraído','cm'], braco_d_contraido:['Braço dir. contraído','cm'], braco_e_contraido:['Braço esq. contraído','cm'],
  antebraco:['Antebraço','cm'], antebraco_d:['Antebraço dir.','cm'], antebraco_e:['Antebraço esq.','cm'],
  coxa:['Coxa','cm'], coxa_d:['Coxa dir.','cm'], coxa_e:['Coxa esq.','cm'], coxa_proximal_d:['Coxa proximal dir.','cm'], coxa_proximal_e:['Coxa proximal esq.','cm'],
  panturrilha:['Panturrilha','cm'], panturrilha_d:['Panturrilha dir.','cm'], panturrilha_e:['Panturrilha esq.','cm'],
  dobra_tricipital:['Dobra tricipital','mm'], dobra_subescapular:['Dobra subescapular','mm'], dobra_peitoral:['Dobra peitoral','mm'],
  dobra_axilar:['Dobra axilar média','mm'], dobra_suprailiaca:['Dobra suprailíaca','mm'], dobra_abdominal:['Dobra abdominal','mm'],
  dobra_coxa:['Dobra da coxa','mm'], soma_dobras:['Soma das dobras','mm']
};
export const MORDER = Object.keys(MKEYS);
export const MHEAD = ['peso','gordura_pct','massa_magra','massa_muscular','cintura','abdomen','braco_d_contraido','braco_contraido','torax','quadril','coxa_d','coxa'];
export const MMANUAL = ['peso','gordura_pct','massa_magra','cintura','abdomen','quadril','torax','braco_d_contraido','braco_e_contraido','coxa_d','coxa_e','panturrilha_d'];
export const POSES = [['frente','Frente'],['lado','Lado'],['costas','Costas']];

// ---------- Utilidades de ficha ----------
export function slug(s){ return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\(.*?\)/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
function str(v){ return v==null ? '' : String(v).trim(); }
function int(v){ const n = parseInt(v,10); return isFinite(n) ? n : null; }
function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }

// Degrau de carga provável pelo nome do exercício
export function chutarAumento(nome){
  const n = slug(nome);
  if(/prancha|abdominal-supra$|^abdominal$|elevacao-de-pernas|flexao-de-braco|barra-fixa|paralela|burpee|polichinelo/.test(n)) return 0;
  if(/leg-press|elevacao-pelvica|hip-thrust/.test(n)) return 10;
  if(/elevacao-lateral|elevacao-frontal|coice/.test(n)){ if(/maquina/.test(n)) return 5; if(/polia|cabo/.test(n)) return 2.5; return 1; }
  if(/polia|cabo|corda|crossover|cross/.test(n)) return 2.5;
  if(/halter/.test(n)) return 2;
  if(/agachamento|terra|stiff/.test(n)) return 4;
  if(/barra/.test(n)) return 2;
  if(/maquina|cadeira|mesa|panturrilha|peck|smith|graviton|hack|articulad/.test(n)) return 5;
  return 2;
}

// Link de vídeo aceito: só http(s)
export function linkOk(u){
  u = String(u==null?'':u).trim();
  if(!u) return '';
  if(!/^https?:\/\//i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
  try{ const x = new URL(u); return (x.protocol==='https:'||x.protocol==='http:') && x.hostname.includes('.') && u.length<=500 ? x.href : ''; }catch(e){ return ''; }
}

// Ficha do banco/edição -> ficha pronta para uso (com chaves calculadas)
export function prepararFicha(src){
  const order = (src.order||[]).filter(L=>src.w && src.w[L]);
  const W = {};
  order.forEach(L=>{
    const w = src.w[L];
    const ex = (w.ex||[]).map(e=>{
      const parts = Array.isArray(e.parts) && e.parts.filter(Boolean).length>1 ? e.parts.filter(Boolean) : [e.n];
      const keys = parts.map(slug);
      const incs = Array.isArray(e.inc) ? parts.map((p,i)=>Number(e.inc[i]) || 0) : parts.map(()=> e.inc==null ? chutarAumento(e.n) : Number(e.inc)||0);
      const r = Array.isArray(e.r) ? [Number(e.r[0])||1, Math.max(Number(e.r[0])||1, Number(e.r[1])||Number(e.r[0])||1)] : [10,12];
      return { n:e.n, parts, bi:parts.length>1, keys, key:keys.join('+'), incs, s:Math.max(1, Number(e.s)||3), r, rest:Math.max(0, Number(e.rest)||60), tip:e.tip||'', video:linkOk(e.video) };
    });
    W[L] = { name:w.name||('Treino '+L), focus:w.focus||'', rest:w.rest||'', ex, total: ex.reduce((n,e)=>n+e.s,0) };
  });
  const sched = {};
  [0,1,2,3,4,5,6].forEach(d=>{ const v = src.sched && src.sched[d]; sched[d] = (v==='ativo'||v==='total'||W[v]) ? v : 'total'; });
  return { order, W, sched };
}

// Ficha em edição/uso -> JSON salvo no banco
export function fichaParaSalvar(f){
  const w = {};
  f.order.forEach(L=>{
    const t = f.w[L];
    w[L] = { name:t.name, focus:t.focus||'', rest:t.rest||'', ex:t.ex.map(e=>{
      const bi = Array.isArray(e.parts) && e.parts.filter(Boolean).length>1;
      const o = { n: bi ? e.parts.filter(Boolean).join(' + ') : e.n, s:e.s, r:e.r, rest:e.rest, tip:e.tip||'' };
      if(linkOk(e.video)) o.video = linkOk(e.video);
      if(bi){ o.parts = e.parts.filter(Boolean); o.inc = o.parts.map((p,i)=>Number(Array.isArray(e.inc)?e.inc[i]:e.inc)||0); }
      else o.inc = Number(Array.isArray(e.inc)?e.inc[0]:e.inc)||0;
      return o;
    })};
  });
  return { treinos:{order:f.order.slice(), w}, cronograma:Object.assign({}, f.sched) };
}

// Resposta da leitura da ficha (IA) -> ficha editável
const DIA_IDX = {dom:0, seg:1, ter:2, qua:3, qui:4, sex:5, sab:6};
export function fichaDaLeitura(out){
  const treinos = Array.isArray(out && out.treinos) ? out.treinos.slice(0, 7) : [];
  const order = [], w = {};
  treinos.forEach((t,i)=>{
    let L = str(t && t.letra).toUpperCase().replace(/[^A-Z]/g,'').slice(0,1) || LETRAS[i];
    if(w[L] || LETRAS.indexOf(L)<0) L = LETRAS.find(x=>!w[x]);
    const ex = (Array.isArray(t.exercicios) ? t.exercicios : []).slice(0, 15).map(e=>{
      const parts = Array.isArray(e.partes) && e.partes.filter(Boolean).length>1 ? e.partes.map(str).filter(Boolean).slice(0,3) : null;
      const n = str(e.nome) || (parts ? parts.join(' + ') : '');
      if(!n) return null;
      const rmin = int(e.reps_min) || int(e.reps_max) || 10;
      const rmax = Math.max(rmin, int(e.reps_max) || rmin);
      return { n, parts, s:clamp(int(e.series)||3, 1, 10), r:[rmin, rmax], rest:clamp(int(e.descanso_s)||60, 0, 600),
        inc: parts ? parts.map(chutarAumento) : chutarAumento(n), tip:str(e.dica) };
    }).filter(Boolean);
    order.push(L);
    w[L] = { name:str(t.nome) || ('Treino '+L), focus:str(t.foco), rest:str(t.descanso), ex };
  });
  let sched = {};
  const cr = out && out.cronograma;
  if(cr && typeof cr==='object'){
    Object.keys(DIA_IDX).forEach(k=>{
      const v = str(cr[k]).toUpperCase();
      sched[DIA_IDX[k]] = w[v] ? v : (/ATIVO/.test(v) ? 'ativo' : 'total');
    });
  } else sched = cronogramaPadrao(order);
  return { nome: str(out && out.nome) || 'Minha ficha', order, w, sched };
}

export function cronogramaPadrao(order){
  const s = {0:'total'}; const dias = [1,2,3,4,5,6];
  dias.forEach((d,i)=>{ s[d] = order[i] || 'total'; });
  if(order.length===5){ return {1:order[0],2:order[1],3:'ativo',4:order[2],5:order[3],6:order[4],0:'total'}; }
  return s;
}

export function copia(o){ return JSON.parse(JSON.stringify(o)); }
