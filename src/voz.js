// Anotar a série falando: "32 quilos 10 repetições", "trinta e dois e meio por dez", "20 12".
const UN = { zero:0, um:1, uma:1, dois:2, duas:2, tres:3, quatro:4, cinco:5, seis:6, sete:7, oito:8, nove:9, dez:10, onze:11, doze:12, treze:13,
  catorze:14, quatorze:14, quinze:15, dezesseis:16, dezessete:17, dezoito:18, dezenove:19, vinte:20, trinta:30, quarenta:40, cinquenta:50,
  sessenta:60, setenta:70, oitenta:80, noventa:90, cem:100, cento:100, duzentos:200, trezentos:300 };
const tira = s => String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function suportaVoz(){ return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition); }

// devolve [{v, tipo:'kg'|'r'|null}] na ordem falada
export function lerNumeros(frase){
  const t = tira(frase).replace(/(\d),(\d)/g, '$1.$2').replace(/[^a-z0-9.\s]/g, ' ').split(/\s+/).filter(Boolean);
  const out = []; let atual = null, vir = false;
  const fecha = () => { if(atual != null){ out.push({ v: atual, tipo: null }); atual = null; } vir = false; };
  for(let i = 0; i < t.length; i++){
    const w = t[i];
    if(/^\d+(\.\d+)?$/.test(w)){ if(atual != null && !vir) fecha(); atual = vir ? atual + Number('0.'+w.replace('.', '')) : Number(w); vir = false; continue; }
    if(w in UN){
      const n = UN[w];
      if(vir && atual != null){ atual = atual + n / 10; vir = false; continue; }
      if(atual == null) atual = n;
      else if(atual % 100 === 0 && atual >= 100 && n < 100) atual += n;
      else if(atual % 10 === 0 && atual >= 20 && n < 10) atual += n;
      else { fecha(); atual = n; }
      continue;
    }
    if(w === 'e' && atual != null) continue;
    if(w === 'meio' || w === 'meia'){ if(atual != null) atual += 0.5; continue; }
    if((w === 'virgula' || w === 'ponto') && atual != null){ vir = true; continue; }
    if(/^(quilo|quilos|kilo|kilos|kg|k)$/.test(w)){ if(atual != null){ out.push({ v: atual, tipo: 'kg' }); atual = null; } else if(out.length) out[out.length-1].tipo = 'kg'; continue; }
    if(/^(rep|reps|repeticao|repeticoes|vez|vezes)$/.test(w)){ if(atual != null){ out.push({ v: atual, tipo: 'r' }); atual = null; } else if(out.length) out[out.length-1].tipo = 'r'; continue; }
    fecha();
  }
  fecha();
  return out;
}
// transforma em pares {kg, r} para cada parte do exercício (bi-set tem 2)
export function interpretar(frase, partes = 1){
  const ns = lerNumeros(frase); if(!ns.length) return null;
  const pares = [];
  let cur = {};
  for(const n of ns){
    const tipo = n.tipo || (cur.kg == null && cur.r == null ? 'kg' : cur.kg != null && cur.r == null ? 'r' : 'kg');
    if(cur[tipo] != null){ pares.push(cur); cur = {}; }
    cur[tipo] = n.v;
    if(cur.kg != null && cur.r != null){ pares.push(cur); cur = {}; }
  }
  if(cur.kg != null || cur.r != null) pares.push(cur);
  // um número só, sem dizer o que é: repetições
  if(ns.length === 1 && !ns[0].tipo) return [{ r: ns[0].v }];
  return pares.slice(0, partes);
}
export function ouvir(){
  return new Promise((ok, falha)=>{
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new R(); rec.lang = 'pt-BR'; rec.interimResults = false; rec.maxAlternatives = 3;
    let feito = false;
    rec.onresult = e => { feito = true; const alts = [...e.results[0]].map(a=>a.transcript); ok(alts); };
    rec.onerror = e => { if(!feito){ feito = true; falha(e.error || 'erro'); } };
    rec.onend = () => { if(!feito) falha('nada'); };
    rec.start();
  });
}
