// Lê uma avaliação física ou uma ficha de treino (fotos ou PDF) com a API do Claude
// e devolve os dados em JSON. Só aceita usuários logados (verify_jwt = true).
//
// Segredos necessários (Supabase > Edge Functions > Secrets):
//   ANTHROPIC_API_KEY   chave da API do Claude (console.anthropic.com)
//   ANTHROPIC_MODEL     opcional, padrão claude-sonnet-5-5

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MEDIDAS = [
  "peso", "altura", "imc", "gordura_pct", "massa_gorda", "massa_magra", "massa_muscular", "agua_pct",
  "gordura_visceral", "tmb", "idade_metabolica", "pescoco", "ombro", "torax", "cintura", "abdomen", "quadril",
  "braco_relaxado", "braco_d_relaxado", "braco_e_relaxado", "braco_contraido", "braco_d_contraido", "braco_e_contraido",
  "antebraco", "antebraco_d", "antebraco_e", "coxa", "coxa_d", "coxa_e", "coxa_proximal_d", "coxa_proximal_e",
  "panturrilha", "panturrilha_d", "panturrilha_e", "dobra_tricipital", "dobra_subescapular", "dobra_peitoral",
  "dobra_axilar", "dobra_suprailiaca", "dobra_abdominal", "dobra_coxa", "soma_dobras",
];

const PROMPTS: Record<string, string> = {
  avaliacao: `Os arquivos são uma avaliação física de academia (antropometria, dobras cutâneas e/ou bioimpedância) de um aluno.
Extraia TODAS as medidas numéricas do aluno que aparecem.

Responda somente com JSON neste formato:
{"data":"AAAA-MM-DD ou null","itens":[{"k":"chave","rotulo":"nome como está no relatório","v":12.5,"u":"cm"}]}

Regras:
- Use estas chaves quando a medida corresponder: ${MEDIDAS.join(", ")}.
- Para medidas fora da lista, crie uma chave curta em snake_case, sem acentos.
- Lado direito e esquerdo viram itens separados (_d e _e). Sem lado indicado, use a chave sem lado (ex.: braco_contraido, coxa, panturrilha).
- "v" é número com ponto decimal. Não invente valores e não arredonde.
- Ignore valores de referência, ideais, metas, faixas de classificação e dados de outras pessoas.
- Se o documento comparar várias avaliações, use só a mais recente e informe a data dela.
- "data" é a data da avaliação; use null se não aparecer.`,

  ficha: `Os arquivos são uma ficha de treino de musculação de um aluno. Transcreva a ficha.

Responda somente com JSON neste formato:
{"nome":"nome da ficha ou null","treinos":[{"letra":"A","nome":"Superior 1","foco":"Empurrar e Largura","descanso":"60-90s","exercicios":[{"nome":"Supino inclinado com halteres","series":4,"reps_min":8,"reps_max":10,"descanso_s":90,"dica":"texto ou null","partes":null}]}],"cronograma":{"seg":"A","ter":"B","qua":"descanso","qui":"C","sex":"D","sab":"E","dom":"descanso"}}

Regras:
- Um item em "treinos" para cada treino (A, B, C...), na ordem da ficha. Se não houver letras, use A, B, C na ordem.
- Bi-set, conjugado ou superset: um único exercício com "partes" listando o nome de cada movimento (ex.: ["Tríceps corda","Rosca direta W"]) e "nome" juntando os dois com " + ".
- "descanso_s" em segundos (2 min = 120). Se a ficha não disser, use 60.
- Repetições "8 a 12" viram reps_min 8 e reps_max 12; um número só vale para os dois. Se for tempo (ex.: 30s de prancha), use reps_min e reps_max 1 e coloque o tempo na dica.
- "dica" é a observação de execução do exercício, se houver.
- "cronograma": dias da semana (seg, ter, qua, qui, sex, sab, dom) com a letra do treino, "descanso" ou "ativo" (descanso ativo). Use null se a ficha não trouxer os dias.
- Não invente exercícios nem números que não estejam na ficha.`,
};

const TIPOS_OK = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function extrairJson(texto: string): unknown {
  const t = texto.trim();
  try { return JSON.parse(t); } catch (_) { /* segue */ }
  const cerca = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (cerca) { try { return JSON.parse(cerca[1]); } catch (_) { /* segue */ } }
  const i = t.indexOf("{"), f = t.lastIndexOf("}");
  if (i >= 0 && f > i) { try { return JSON.parse(t.slice(i, f + 1)); } catch (_) { /* segue */ } }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "metodo" }, 405);

  const chave = Deno.env.get("ANTHROPIC_API_KEY");
  const modelo = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5-5";

  let corpo: { tipo?: string; arquivos?: { type?: string; data?: string }[] };
  try { corpo = await req.json(); } catch (_) { return json({ error: "corpo" }, 400); }

  // Verificação da área do admin: diz se a chave existe e se a API aceita (não gasta tokens).
  if (corpo.tipo === "status") {
    if (!chave) return json({ chave: false, valida: false, modelo });
    try {
      const t = await fetch("https://api.anthropic.com/v1/models?limit=1", { headers: { "x-api-key": chave, "anthropic-version": "2023-06-01" } });
      return json({ chave: true, valida: t.ok, http: t.status, modelo });
    } catch (_) {
      return json({ chave: true, valida: false, http: 0, modelo });
    }
  }

  if (!chave) return json({ error: "sem_chave" }, 503);

  const tipo = corpo.tipo ?? "";
  const arquivos = Array.isArray(corpo.arquivos) ? corpo.arquivos : [];
  if (!PROMPTS[tipo]) return json({ error: "tipo" }, 400);
  if (!arquivos.length || arquivos.length > 6) return json({ error: "arquivos" }, 400);
  let total = 0;
  for (const a of arquivos) {
    if (!a || !TIPOS_OK.includes(a.type ?? "") || typeof a.data !== "string") return json({ error: "arquivo_invalido" }, 400);
    total += a.data.length;
  }
  if (total > 20_000_000) return json({ error: "grande_demais" }, 413);

  const content: unknown[] = arquivos.map((a) =>
    a.type === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: a.data } }
      : { type: "image", source: { type: "base64", media_type: a.type, data: a.data } }
  );
  content.push({ type: "text", text: PROMPTS[tipo] });

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 8000,
      messages: [{ role: "user", content }],
    }),
  });

  if (!r.ok) {
    const detalhe = await r.text();
    console.error("Erro da API do Claude", r.status, detalhe.slice(0, 500));
    return json({ error: r.status === 401 ? "chave_invalida" : r.status === 429 ? "limite" : "ia", status: r.status }, 502);
  }

  const saida = await r.json();
  const texto = (saida.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
  const dados = extrairJson(texto);
  if (!dados || typeof dados !== "object") return json({ error: "json" }, 422);
  return json(dados);
});
