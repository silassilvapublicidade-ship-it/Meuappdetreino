// Relatório do mês em PDF (para o personal ou o nutricionista). Carregado só quando alguém pede o relatório.
import { jsPDF } from 'jspdf';

const COR = { tinta: [20, 28, 36], suave: [96, 110, 122], linha: [222, 228, 233], destaque: [14, 150, 135], fundo: [243, 247, 249], sobe: [14, 150, 135], desce: [204, 82, 64] };
const W = 210, M = 16, LARG = W - 2 * M;
const n1 = v => v == null ? '—' : (Math.round(v * 10) / 10).toLocaleString('pt-BR');
const sinal = (v, u = '') => v == null ? '' : (v > 0 ? '+' : v < 0 ? '-' : '') + n1(Math.abs(v)) + u;

export async function gerarRelatorio(d){
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 0;
  const cor = c => pdf.setTextColor(...c);
  const fonte = (tam, peso = 'normal') => { pdf.setFont('helvetica', peso); pdf.setFontSize(tam); };
  const novaPagina = () => { rodape(); pdf.addPage(); y = M; };
  const espaco = h => { if(y + h > 297 - 18) novaPagina(); };
  const rodape = () => { fonte(8); cor(COR.suave); pdf.text(`Meus Treinos · relatório gerado em ${d.geradoEm}`, M, 289); pdf.text(`página ${pdf.getNumberOfPages()}`, W - M, 289, { align: 'right' }); };
  const secao = titulo => { espaco(16); y += 4; fonte(12, 'bold'); cor(COR.destaque); pdf.text(titulo.toUpperCase(), M, y); y += 2; pdf.setDrawColor(...COR.destaque); pdf.setLineWidth(0.5); pdf.line(M, y, M + 22, y); y += 6; };
  const texto = (t, tam = 10, c = COR.tinta) => { fonte(tam); cor(c); const linhas = pdf.splitTextToSize(t, LARG); espaco(linhas.length * tam * 0.42 + 2); pdf.text(linhas, M, y); y += linhas.length * tam * 0.42 + 2; };
  // blocos de números lado a lado
  const blocos = itens => {
    const n = itens.length, gap = 3, w = (LARG - gap * (n - 1)) / n, h = 20; espaco(h + 4);
    itens.forEach(([rotulo, valor, sub], i) => {
      const x = M + i * (w + gap);
      pdf.setFillColor(...COR.fundo); pdf.roundedRect(x, y, w, h, 2, 2, 'F');
      fonte(7.5, 'bold'); cor(COR.suave); pdf.text(rotulo.toUpperCase(), x + 3, y + 5.5);
      fonte(14, 'bold'); cor(COR.tinta); pdf.text(String(valor), x + 3, y + 12.5);
      if(sub){ fonte(7.5); cor(sub.startsWith('+') ? COR.sobe : sub.startsWith('-') ? COR.desce : COR.suave); pdf.text(pdf.splitTextToSize(sub, w - 6)[0], x + 3, y + 17.5); }
    });
    y += h + 4;
  };
  // tabela simples
  const tabela = (cab, linhas, larguras, alinhar = []) => {
    const lh = 6.6; espaco(lh * 2);
    const xs = []; let acc = M; larguras.forEach(w => { xs.push(acc); acc += w * LARG; });
    const cabecalho = () => { fonte(8, 'bold'); cor(COR.suave); cab.forEach((c, i) => pdf.text(c, alinhar[i] === 'r' ? xs[i] + larguras[i] * LARG - 1 : xs[i], y, alinhar[i] === 'r' ? { align: 'right' } : undefined)); y += 2; pdf.setDrawColor(...COR.linha); pdf.setLineWidth(0.3); pdf.line(M, y, W - M, y); y += 4.5; };
    cabecalho();
    linhas.forEach(l => {
      if(y + lh > 297 - 18){ novaPagina(); cabecalho(); }
      l.forEach((c, i) => {
        const val = typeof c === 'object' && c ? c : { t: String(c ?? '') };
        fonte(9, i === 0 ? 'bold' : 'normal'); cor(val.cor || COR.tinta);
        let t = val.t; const max = larguras[i] * LARG - 2;
        while(pdf.getTextWidth(t) > max && t.length > 3) t = t.slice(0, -2) + '…';
        pdf.text(t, alinhar[i] === 'r' ? xs[i] + larguras[i] * LARG - 1 : xs[i], y, alinhar[i] === 'r' ? { align: 'right' } : undefined);
      });
      pdf.setDrawColor(...COR.linha); pdf.setLineWidth(0.15); pdf.line(M, y + 2.2, W - M, y + 2.2); y += lh;
    });
    y += 3;
  };
  // barras de treinos por semana
  const barras = (sem, meta) => {
    const h = 34; espaco(h + 10);
    const max = Math.max(meta || 0, ...sem.map(s => s.n), 1), bw = Math.min(22, (LARG - 10) / sem.length - 4);
    const base = y + h;
    if(meta){ const ym = base - meta / max * (h - 6); pdf.setDrawColor(...COR.suave); pdf.setLineDashPattern([1, 1], 0); pdf.line(M, ym, W - M, ym); pdf.setLineDashPattern([], 0); fonte(7); cor(COR.suave); pdf.text(`meta ${meta}`, W - M, ym - 1, { align: 'right' }); }
    sem.forEach((s, i) => {
      const x = M + 4 + i * (bw + 4), bh = s.n / max * (h - 6);
      pdf.setFillColor(...(meta && s.n >= meta ? COR.destaque : [120, 190, 205])); if(bh > 0) pdf.roundedRect(x, base - bh, bw, bh, 1, 1, 'F');
      fonte(9, 'bold'); cor(COR.tinta); pdf.text(String(s.n), x + bw / 2, base - bh - 1.5, { align: 'center' });
      fonte(7); cor(COR.suave); pdf.text(s.lbl, x + bw / 2, base + 4, { align: 'center' });
    });
    y = base + 9;
  };

  /* ---- capa ---- */
  y = M + 4;
  fonte(9, 'bold'); cor(COR.destaque); pdf.text('MEUS TREINOS · RELATÓRIO DO MÊS', M, y); y += 9;
  fonte(22, 'bold'); cor(COR.tinta); pdf.text(`${d.mesNome} de ${d.ano}`, M, y); y += 7;
  fonte(11); cor(COR.suave); pdf.text(`${d.nome} · ${d.periodo}`, M, y); y += 5;
  if(d.fichas.length){ fonte(9); pdf.text(pdf.splitTextToSize('Ficha: ' + d.fichas.join(' · '), LARG), M, y); y += 5; }
  y += 3;

  /* ---- treinos ---- */
  secao('Treinos');
  blocos([
    ['Treinos', d.treinos, d.ant ? sinal(d.treinos - d.ant.treinos) + ' vs. mês anterior' : ''],
    ['Cardio e aulas', d.cardio, ''],
    ['Dias treinados', d.dias, ''],
    ['Séries feitas', d.series, d.ant ? sinal(d.series - d.ant.series) + ' vs. mês anterior' : ''],
    ['Tempo total', d.tempo, ''],
  ]);
  if(d.semanas.length){ texto(`Treinos por semana${d.metaSemana ? ` (meta: ${d.metaSemana} por semana)` : ''}`, 9, COR.suave); barras(d.semanas, d.metaSemana); }
  if(d.porTreino.length) tabela(['Treino', 'Vezes no mês', 'Última vez'], d.porTreino.map(t => [t.nome, String(t.n), t.ultima]), [0.6, 0.2, 0.2], ['', 'r', 'r']);
  if(d.esforco) texto(`Esforço médio informado: ${d.esforco}.${d.dores.length ? ' Dor relatada em: ' + d.dores.join(', ') + '.' : ' Nenhuma dor relatada.'}`, 9.5);

  /* ---- cargas ---- */
  if(d.cargas.length){
    secao('Cargas');
    texto('Maior carga de cada exercício no começo e no fim do mês (repetições pela ficha).', 9, COR.suave);
    tabela(['Exercício', 'Treinos', 'Início', 'Fim', 'Diferença'],
      d.cargas.map(c => [c.nome, String(c.n), c.ini != null ? n1(c.ini) + ' kg' : '—', c.fim != null ? n1(c.fim) + ' kg' : '—',
        { t: c.dif ? sinal(c.dif, ' kg') : '=', cor: c.dif > 0 ? COR.sobe : c.dif < 0 ? COR.desce : COR.suave }]),
      [0.46, 0.12, 0.14, 0.14, 0.14], ['', 'r', 'r', 'r', 'r']);
    if(d.recordes) texto(`${d.recordes} ${d.recordes === 1 ? 'exercício bateu' : 'exercícios bateram'} recorde de carga no mês.`, 9.5);
  }

  /* ---- corpo ---- */
  if(d.peso || d.medidas.length){
    secao('Corpo');
    if(d.peso) blocos([
      ['Peso no início', d.peso.ini != null ? n1(d.peso.ini) + ' kg' : '—', d.peso.dataIni || ''],
      ['Peso no fim', d.peso.fim != null ? n1(d.peso.fim) + ' kg' : '—', d.peso.dataFim || ''],
      ['Variação', d.peso.dif != null ? sinal(d.peso.dif, ' kg') : '—', d.peso.n + (d.peso.n === 1 ? ' pesagem' : ' pesagens')],
      ['Meta', d.peso.meta != null ? n1(d.peso.meta) + ' kg' : '—', d.peso.falta != null ? 'faltam ' + n1(Math.abs(d.peso.falta)) + ' kg' : ''],
    ]);
    if(d.medidas.length){
      texto(`Avaliação física de ${d.avalData}${d.avalAnt ? ` comparada com ${d.avalAnt}` : ''}:`, 9, COR.suave);
      tabela(['Medida', 'Valor', 'Antes', 'Diferença'], d.medidas.map(m => [m.nome, m.valor, m.antes || '—', { t: m.dif || '', cor: COR.suave }]), [0.46, 0.18, 0.18, 0.18], ['', 'r', 'r', 'r']);
    }
  }

  /* ---- sono e água ---- */
  if(d.sono || d.agua){
    secao('Sono e hidratação');
    const it = [];
    if(d.sono){ it.push(['Sono médio', d.sono.media, d.sono.n + ' noites registradas']); it.push(['Noites na meta', d.sono.metaOk, 'meta de ' + d.sono.meta]); if(d.sono.despertares) it.push(['Despertares', d.sono.despertares, 'acordou na noite']); }
    if(d.agua){ it.push(['Água por dia', d.agua.media, d.agua.n + ' dias registrados']); it.push(['Dias na meta', d.agua.ok, 'meta de ' + d.agua.meta]); }
    blocos(it.slice(0, 5));
  }

  /* ---- fotos ---- */
  if(d.fotos && d.fotos.length){
    secao('Fotos');
    const h = 78, w = h * 3 / 4, gap = 8; espaco(h + 10);
    d.fotos.slice(0, 2).forEach((f, i) => {
      const x = M + i * (w + gap);
      try{ pdf.addImage(f.dataUrl, 'JPEG', x, y, w, h, undefined, 'MEDIUM'); }catch(e){ pdf.setFillColor(...COR.fundo); pdf.rect(x, y, w, h, 'F'); }
      fonte(8.5, 'bold'); cor(COR.tinta); pdf.text(f.rotulo, x, y + h + 5);
    });
    y += h + 10;
  }

  if(d.obs){ secao('Observações'); texto(d.obs, 9.5); }
  rodape();
  return pdf.output('blob');
}
