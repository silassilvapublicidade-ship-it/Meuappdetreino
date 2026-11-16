// Técnicas de treino: quando o nome ou a dica do exercício citar uma delas,
// o app mostra um selo que abre a explicação de como fazer.
export const TECNICAS = [
  { id:'biset', nome:'Bi-set', re:/\bbi[\s-]?set\b|\bsuper[\s-]?s[ée]rie\b|\bsuperset\b|\bconjugad[oa]\b/i,
    resumo:'Dois exercícios seguidos, sem descanso entre eles. O descanso só vem depois do segundo.',
    passos:['Prepare os dois equipamentos antes de começar, para não perder tempo na troca.','Faça todas as repetições do 1º exercício.','Vá direto para o 2º, sem descansar.','Agora sim descanse o tempo indicado. Isso conta como 1 série.','Repita até completar as séries.'],
    obs:'A carga costuma ser um pouco menor que fazendo cada exercício sozinho. No app, registre a carga de cada um nos dois campos da mesma série.' },
  { id:'triset', nome:'Tri-set', re:/\btri[\s-]?set\b/i,
    resumo:'Três exercícios seguidos, sem descanso entre eles.',
    passos:['Deixe os três equipamentos prontos.','Faça o 1º, o 2º e o 3º exercício em sequência, sem pausa.','Descanse o tempo indicado depois do 3º. Isso é 1 série.','Repita até completar as séries.'],
    obs:'Use cargas moderadas: o cansaço acumula rápido.' },
  { id:'giant', nome:'Giant set / circuito', re:/\bgiant[\s-]?set\b|\bcircuito\b/i,
    resumo:'Quatro ou mais exercícios em sequência, sem descanso entre eles.',
    passos:['Monte a sequência de exercícios antes de começar.','Passe de um para o outro sem descansar.','Descanse só no fim da volta.','Repita o número de voltas indicado.'],
    obs:'Ótimo para gasto calórico. Mantenha a execução limpa mesmo cansado.' },
  { id:'restpause', nome:'Rest-pause', re:/\brest[\s-]?pause\b/i,
    resumo:'Ir até perto da falha, descansar de 10 a 20 segundos e continuar com a mesma carga.',
    passos:['Faça as repetições até não conseguir mais nenhuma com boa execução.','Solte o peso e descanse de 10 a 20 segundos.','Com a mesma carga, faça mais repetições até a falha de novo (geralmente 2 a 4).','Se a ficha pedir, repita a pausa mais uma ou duas vezes.','Tudo isso conta como 1 série.'],
    obs:'Use em máquinas ou com alguém ajudando. Evite em agachamento livre ou supino sem apoio.' },
  { id:'dropset', nome:'Drop-set', re:/\bdrop[\s-]?set\b|\bdrop\b/i,
    resumo:'Ao chegar na falha, reduzir a carga na hora e continuar sem descanso.',
    passos:['Faça as repetições com a carga normal até a falha.','Tire de 20% a 30% do peso imediatamente (pino da máquina ou halter mais leve).','Sem descansar, faça o máximo de repetições de novo.','Se a ficha pedir duplo ou triplo drop, reduza mais uma vez e continue.','Tudo isso conta como 1 série.'],
    obs:'Normalmente só na última série do exercício. Funciona melhor em máquinas e halteres.' },
  { id:'piramide', nome:'Pirâmide', re:/\bpir[âa]mide\b/i,
    resumo:'A carga muda a cada série e as repetições mudam no sentido contrário.',
    passos:['Crescente: a cada série, aumente a carga e diminua as repetições (ex.: 15, 12, 10, 8).','Decrescente: comece pesado e vá tirando carga, aumentando as repetições.','Descanse normalmente entre as séries.'],
    obs:'No app, registre a carga real de cada série.' },
  { id:'cluster', nome:'Cluster', re:/\bcluster\b/i,
    resumo:'A série é dividida em blocos curtos com pausas de 10 a 20 segundos.',
    passos:['Faça um bloco de poucas repetições (ex.: 3 ou 4) com carga alta.','Pause de 10 a 20 segundos.','Repita os blocos até completar o total de repetições da série.','Depois descanse o tempo normal.'],
    obs:'Permite usar mais carga com boa técnica.' },
  { id:'falha', nome:'Até a falha', re:/\bfalha\b/i,
    resumo:'Fazer repetições até não conseguir completar mais nenhuma com boa execução.',
    passos:['Faça as repetições com controle.','Pare quando a próxima repetição exigir roubar no movimento.','Falha não é "tremer até cair": a técnica vem primeiro.'],
    obs:'Use com cuidado em exercícios livres pesados. Em máquina é mais seguro.' },
  { id:'isometria', nome:'Isometria', re:/\bisometria\b|\bisom[ée]tric[oa]\b|\bsegure\b/i,
    resumo:'Manter o músculo contraído numa posição, sem movimento, pelo tempo indicado.',
    passos:['Vá até a posição indicada (ex.: meio do agachamento, prancha).','Segure firme, respirando normalmente, sem prender o ar.','Mantenha o tempo pedido e solte com controle.'],
    obs:'No app, a série vale como 1 repetição: registre se completou o tempo.' },
  { id:'negativa', nome:'Negativa / excêntrica lenta', re:/\bnegativ[ao]s?\b|\bexc[êe]ntric[ao]\b/i,
    resumo:'Descer o peso bem devagar, controlando a volta do movimento.',
    passos:['Suba (ou empurre) o peso no ritmo normal.','Na volta, conte de 3 a 5 segundos até o fim do movimento.','Não deixe o peso cair nem bater.'],
    obs:'Aumenta o estímulo sem precisar de muita carga. Pode deixar mais dolorido nos dias seguintes.' },
  { id:'cadencia', nome:'Cadência', re:/\bcad[êe]ncia\b|\b\d-\d-\d(-\d)?\b/i,
    resumo:'O ritmo de cada fase do movimento, em segundos.',
    passos:['Ex.: cadência 3-1-1 = 3 segundos descendo, 1 segundo parado, 1 segundo subindo.','Quando houver 4 números, o último é a pausa no topo.','Conte mentalmente em todas as repetições.'],
    obs:'' },
  { id:'parciais', nome:'Parciais', re:/\bparcia(l|is)\b/i,
    resumo:'Repetições com amplitude reduzida, geralmente depois de chegar na falha.',
    passos:['Termine as repetições completas da série.','Sem soltar o peso, faça mais algumas repetições só na parte do movimento que ainda consegue.','Pare quando nem a parcial sair com controle.'],
    obs:'' },
  { id:'unilateral', nome:'Unilateral', re:/\bunilateral\b|\bpor (perna|bra[çc]o|lado)\b|\bcada lado\b/i,
    resumo:'Um lado de cada vez.',
    passos:['Faça todas as repetições com um lado.','Troque e faça o mesmo número com o outro, sem descanso entre os lados.','As repetições indicadas valem para cada lado.'],
    obs:'Comece pelo lado mais fraco e iguale o outro a ele.' },
];

export function tecnicasDe(e){
  const txt = [e && e.n, e && e.tip].filter(Boolean).join(' · ');
  const out = TECNICAS.filter(t => t.re.test(txt));
  if(e && e.bi && !out.some(t=>t.id==='biset'||t.id==='triset'||t.id==='giant')){
    const n = (e.parts||[]).length;
    out.unshift(TECNICAS.find(t=>t.id===(n>=4?'giant':n===3?'triset':'biset')));
  }
  return out;
}
export function tecnica(id){ return TECNICAS.find(t=>t.id===id) || null; }
