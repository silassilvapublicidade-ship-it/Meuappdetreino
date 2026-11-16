// Biblioteca de exercícios: acha o vídeo do catálogo mais parecido com o nome do exercício da ficha.

export const GRUPOS = {
  4:'Performance · inferiores', 5:'Performance · superiores', 6:'Reatividade', 7:'Potência e aterrissagem', 8:'Velocidade e agilidade',
  9:'Ativação', 10:'Core e abdômen', 11:'Mobilidade e alongamento', 12:'Skills e agilidade', 13:'Liberação miofascial',
  14:'Empurrar · peito e ombro', 15:'Puxar · costas', 16:'Joelho · pernas', 17:'Quadril · glúteo e posterior', 18:'Isolados · braços e ombro', 19:'Cardio'
};
const PREFERIDOS = new Set([10,14,15,16,17,18,19]);

// Frases equivalentes (aplicadas no texto já sem acento, com hífens)
const FRASES = [
  [/\b(supino-reto-(na-)?maquina|supino-(na-)?maquina|supino-sentado-(na-)?maquina)\b/g, 'supino-vertical-maquina'],
  [/\b(desenvolvimento-arnold|arnold)\b/g, 'arnold-press'],
  [/\bbulgaro-(com-)?halter(es)?\b/g, 'bulgaro-carga'], [/\bsem-carga\b/g, 'peso-corporal'],
  [/\b(triangulo|pegada-triangulo)\b/g, 'pegada-fechada'],
  [/\b(peck-deck|voador|crucifixo-(na-)?maquina|crucifixo-maquina|fly-maquina)\b/g, 'fly'],
  [/\b(crucifixo-inverso|voador-inverso|peck-deck-inverso|crucifixo-invertido|fly-invertido)\b/g, 'fly-inverso'],
  [/\b(cadeira-extensora|maquina-extensora)\b/g, 'extensora'],
  [/\bmesa-flexora\b/g, 'flexora-deitado'], [/\bcadeira-flexora\b/g, 'flexora-sentado'], [/\bflexora-em-pe\b/g, 'flexora-vertical'],
  [/\b(cadeira-abdutora|abdutora-maquina|abducao-(de-quadril-)?(na-)?maquina)\b/g, 'abdutora'],
  [/\bremada-curvada\b/g, 'puxada-curvada'], [/\bremada-unilateral\b/g, 'puxada-unilateral-serrote'], [/\bserrote\b/g, 'puxada-unilateral-serrote'],
  [/\b(puxada-frontal|puxada-pela-frente|pulley-frente|puxada-alta-frente|pulldown-frente)\b/g, 'puxada-alta-aberta'],
  [/\baberta-(pegada-)?(fechada|neutra|supinada|supinado)\b/g, '$2'],
  [/\b(pullover|pull-over|pulldown)\b/g, 'pulldown'],
  [/\b(agachamento-livre|agachamento-com-barra|agachamento-barra)\b/g, 'agachamento-barra-costas'],
  [/\b(afundo-bulgaro|agachamento-bulgaro|bulgaro)\b/g, 'bulgaro'],
  [/\b(hip-thrust|elevacao-de-quadril-com-barra)\b/g, 'elevacao-pelvica-barra'],
  [/\b(levantamento-terra|terra-convencional)\b/g, 'terra-barra'], [/\bstiff-romeno\b/g, 'stiff'],
  [/\b(leg-45|leg-press-inclinado)\b/g, 'leg-press-45'],
  [/\b(triceps-pulley|triceps-barra-(na-)?polia|triceps-na-polia|triceps-polia-barra)\b/g, 'triceps-polia'],
  [/\b(desenvolvimento-militar)\b/g, 'desenvolvimento-barra'],
  [/\babdominal-supra\b/g, 'abdominal'], [/\b(flexao-de-braco|flexoes|apoio-de-frente)\b/g, 'flexao-braco'],
  [/\b(esteira)\b/g, 'corrida'], [/\b(bike|bicicleta-ergometrica)\b/g, 'bicicleta']
];
const PALAVRA = { halteres:'halter', haltere:'halter', barras:'barra', maquinas:'maquina', polias:'polia', cross:'polia', crossover:'polia', cabo:'polia', cabos:'polia', pulley:'polia',
  elevacoes:'elevacao', roscas:'rosca', pernas:'perna', ombros:'ombro', bracos:'braco', alternada:'alternado', unilaterais:'unilateral', triceps:'triceps', biceps:'biceps',
  pronada:'pronado', supinada:'supinado', isometrica:'isometrico', dinamica:'dinamico', deitada:'deitado', sentada:'sentado', pe:'pe', w:'w' };
const VAZIAS = new Set(['de','da','do','das','dos','com','c','na','no','nas','nos','em','e','a','o','as','os','para','p','pra','ou','padrao','tf','ta','tp','variacao','livre','exercicio','maquina-ou-barra']);

export function tokens(nome){
  // bi-set: usa o primeiro exercício; o que está entre parênteses conta (ex.: "(aberta)")
  let s = String(nome||'').split('+')[0].normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  FRASES.forEach(([re, r])=>{ s = s.replace(re, r); });
  return s.split('-').map(w=>PALAVRA[w]||w).filter(w=>w && !VAZIAS.has(w) && !/^\d$/.test(w) || /^(45|90)$/.test(w));
}

let INDICE = null;
export function prepararCatalogo(lista){
  INDICE = (lista||[]).map(c=>{ const tk = tokens(c.titulo); return { ...c, t: new Set(tk), primeira: tk[0] }; });
  return INDICE.length;
}

// Retorna {item, nota} do melhor vídeo, ou null se não houver um parecido o bastante
export function acharNoCatalogo(nome){
  if(!INDICE || !INDICE.length) return null;
  const F = [...new Set(tokens(nome))]; if(!F.length) return null;
  const cabeca = F[0];
  // as duas primeiras palavras (movimento e variação) pesam o dobro
  const peso = w=> F.indexOf(w) < 2 ? 2 : 1;
  const total = F.reduce((n,w)=>n+peso(w), 0);
  let melhor = null;
  for(const c of INDICE){
    if(!c.t.has(cabeca)) continue;
    let ganho = 0, inter = 0; F.forEach(w=>{ if(c.t.has(w)){ ganho += peso(w); inter++; } });
    let nota = 0.8*(ganho/total) + 0.2*(inter/c.t.size);
    if(c.primeira !== cabeca) nota -= 0.25;
    nota += PREFERIDOS.has(c.modulo) ? 0.05 : -0.15;
    if(!melhor || nota > melhor.nota) melhor = { item:c, nota };
  }
  return melhor && melhor.nota >= 0.7 ? melhor : null;
}
