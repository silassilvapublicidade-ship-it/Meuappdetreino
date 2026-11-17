// Notificações no celular (Web Push) do Meus Treinos.
// Chamada pelo próprio banco (gatilhos e pg_cron) com a chave interna no cabeçalho x-chave.
//   {tipo:'treino', id}   -> avisa o grupo que alguém terminou o treino
//   {tipo:'reacao', id}   -> avisa quem recebeu a reação
//   {tipo:'lembretes'}    -> lembrete nos dias de treino, na hora escolhida
//   {tipo:'resumo'}       -> domingo à noite: resumo da semana de cada pessoa
//   {tipo:'teste'}        -> chamado pelo app (com login): aviso de teste para a própria pessoa
//   {tipo:'setup'}        -> cria as chaves VAPID se ainda não existirem (não precisa da chave interna)
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const SITE = "https://meuappdetreino.vercel.app";
const FUSO = "America/Sao_Paulo";

type Segredos = { chave_interna: string | null; vapid_publica: string | null; vapid_privada: string | null };
let cache: Segredos | null = null;

async function segredos(): Promise<Segredos> {
  if (cache && cache.vapid_privada) return cache;
  const { data, error } = await sb.rpc("notif_segredos");
  if (error) throw error;
  cache = (Array.isArray(data) ? data[0] : data) as Segredos;
  return cache;
}

async function garantirVapid(): Promise<Segredos> {
  let s = await segredos();
  if (!s.vapid_publica || !s.vapid_privada) {
    const k = webpush.generateVAPIDKeys();
    const { error } = await sb.rpc("notif_guardar_vapid", { p_publica: k.publicKey, p_privada: k.privateKey });
    if (error) throw error;
    cache = null;
    s = await segredos();
  }
  webpush.setVapidDetails(SITE, s.vapid_publica!, s.vapid_privada!);
  return s;
}

function iguais(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function primeiroNome(n?: string | null) {
  const p = String(n || "").trim().split(/\s+/)[0] || "Alguém";
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

type Msg = { title: string; body: string; url?: string; tag?: string };

async function enviar(usuarios: string[], msg: Msg) {
  if (!usuarios.length) return 0;
  const { data: subs } = await sb.from("push_subs").select("endpoint,p256dh,auth,user_id").in("user_id", usuarios);
  let ok = 0;
  await Promise.all((subs || []).map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title: msg.title, body: msg.body, url: msg.url || "/", tag: msg.tag || "mt" }),
        { TTL: 6 * 3600, urgency: "high" },
      );
      ok++;
    } catch (e) {
      const st = (e as { statusCode?: number }).statusCode;
      if (st === 404 || st === 410) await sb.from("push_subs").delete().eq("endpoint", s.endpoint);
      else console.error("push falhou", st, String((e as Error).message || e).slice(0, 200));
    }
  }));
  return ok;
}

async function querem(usuarios: string[], chave: "grupo" | "reacoes" | "lembrete" | "resumo") {
  if (!usuarios.length) return [];
  const { data } = await sb.from("profiles").select("id,notif").in("id", usuarios);
  const fora = new Set((data || []).filter((p) => p.notif && p.notif[chave] === false).map((p) => p.id));
  return usuarios.filter((u) => !fora.has(u));
}

async function treinoTerminado(id: string) {
  const { data: s } = await sb.from("sessions").select("user_id,letter,workout_name,dur_s,started_at").eq("id", id).maybeSingle();
  if (!s) return 0;
  const { data: perfil } = await sb.from("profiles").select("nome").eq("id", s.user_id).maybeSingle();
  const { data: meus } = await sb.from("group_members").select("group_id").eq("user_id", s.user_id);
  const grupos = (meus || []).map((g) => g.group_id);
  if (!grupos.length) return 0;
  const { data: membros } = await sb.from("group_members").select("user_id").in("group_id", grupos);
  const outros = [...new Set((membros || []).map((m) => m.user_id).filter((u) => u !== s.user_id))];
  const nome = primeiroNome(perfil?.nome);
  const min = s.dur_s ? Math.round(s.dur_s / 60) : 0;
  const cardio = s.letter === "CARDIO";
  const aula = cardio && (s.workout_name === "Spinning" || s.workout_name === "Jump");
  const icone = s.workout_name === "Spinning" ? "🚴" : "🤸";
  return enviar(await querem(outros, "grupo"), {
    title: aula ? `${nome} fez aula de ${String(s.workout_name).toLowerCase()} ${icone}` : cardio ? `${nome} fez cardio 🏃` : `${nome} terminou o treino 💪`,
    body: (aula ? "Aula registrada" : cardio ? "Cardio registrado" : `Treino ${s.letter}${s.workout_name ? " · " + s.workout_name : ""}`) +
      (min ? ` · ${min} min` : "") + ". Toque para reagir.",
    url: "/?v=hoje",
    tag: "treino-" + s.user_id,
  });
}

async function reacao(id: string) {
  const { data: r } = await sb.from("group_reactions").select("from_user,to_user,emoji").eq("id", id).maybeSingle();
  if (!r || r.from_user === r.to_user) return 0;
  const { data: perfil } = await sb.from("profiles").select("nome").eq("id", r.from_user).maybeSingle();
  return enviar(await querem([r.to_user], "reacoes"), {
    title: `${primeiroNome(perfil?.nome)} reagiu ${r.emoji}`,
    body: "ao seu treino de hoje.",
    url: "/?v=hoje",
    tag: "reacao-" + r.from_user,
  });
}

function agoraLocal() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
  }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  const dias: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { data: `${p.year}-${p.month}-${p.day}`, min: +p.hour * 60 + +p.minute, dia: dias[p.weekday as string] };
}

async function lembretes() {
  const agora = agoraLocal();
  const { data: perfis } = await sb.from("profiles").select("id,nome,notif,lembrete_hora,lembrete_ultimo").not("lembrete_hora", "is", null);
  let enviados = 0;
  for (const p of perfis || []) {
    if (p.notif && p.notif.lembrete === false) continue;
    if (p.lembrete_ultimo && p.lembrete_ultimo >= agora.data) continue;
    const [h, m] = String(p.lembrete_hora).split(":").map(Number);
    const alvo = h * 60 + m;
    if (agora.min < alvo || agora.min > alvo + 30) continue; // janela de 30 min
    const { data: ficha } = await sb.from("plans").select("treinos,cronograma").eq("user_id", p.id).eq("ativa", true).maybeSingle();
    const letra = ficha?.cronograma?.[String(agora.dia)];
    const W = letra && ficha?.treinos?.w?.[letra];
    // marca como visto hoje mesmo sem treino, para não repetir a checagem
    await sb.from("profiles").update({ lembrete_ultimo: agora.data }).eq("id", p.id);
    if (!W) continue;
    const ini = new Date(Date.now() - 12 * 3600e3).toISOString();
    const { count } = await sb.from("sessions").select("id", { count: "exact", head: true }).eq("user_id", p.id).gte("started_at", ini).neq("letter", "CARDIO");
    if (count) continue;
    const sabado = agora.dia === 6;
    enviados += await enviar([p.id], {
      title: `Hoje é Treino ${letra} 💪`,
      body: `${W.name}${W.focus ? " · " + W.focus : ""}`.slice(0, 140) + (sabado ? " Treino em família hoje!" : " Bora?"),
      url: "/?v=hoje",
      tag: "lembrete",
    });
  }
  return enviados;
}

// Início da semana (segunda 00:00 em Brasília) em ISO UTC
function inicioSemanaISO() {
  const a = agoraLocal();
  const volta = (a.dia + 6) % 7; // dias desde segunda
  const [y, m, d] = a.data.split("-").map(Number);
  const seg = new Date(Date.UTC(y, m - 1, d - volta, 3, 0, 0)); // 00:00 em Brasília = 03:00 UTC
  return seg.toISOString();
}
function toneladas(kg: number) {
  return (kg / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: kg >= 10000 ? 0 : 1 });
}
function horasTxt(seg: number) {
  const m = Math.round(seg / 60), h = Math.floor(m / 60), r = m % 60;
  return h ? `${h}h${String(r).padStart(2, "0")}` : `${m} min`;
}
type Ex = { keys?: string[]; sets?: { p?: { kg?: number | string | null }[] }[] };
function maximos(lista: { ex: Ex[] | null }[]) {
  const best: Record<string, number> = {};
  for (const s of lista) for (const e of s.ex || []) (e.keys || []).forEach((k, i) => {
    for (const st of e.sets || []) {
      const kg = Number(st.p?.[i]?.kg);
      if (kg > 0 && !(best[k] >= kg)) best[k] = kg;
    }
  });
  return best;
}
async function resumo(previa?: Msg[]) {
  const { data: subs } = await sb.from("push_subs").select("user_id");
  const usuarios = await querem([...new Set((subs || []).map((x) => x.user_id))], "resumo");
  const ini = inicioSemanaISO();
  let enviados = 0;
  for (const uid of usuarios) {
    const { data: todas } = await sb.from("sessions").select("letter,started_at,dur_s,vol,ex").eq("user_id", uid).order("started_at", { ascending: true }).limit(2000);
    const lista = todas || [];
    const semana = lista.filter((s) => s.started_at >= ini);
    const treinos = semana.filter((s) => s.letter !== "CARDIO");
    const cardios = semana.length - treinos.length;
    const dias = new Set(semana.map((s) => new Date(s.started_at).toLocaleDateString("en-CA", { timeZone: FUSO }))).size;
    let msg: Msg;
    if (!semana.length) {
      msg = { title: "Nova semana começa amanhã 💪", body: "Essa semana passou sem treino. Que tal abrir a próxima com tudo?", url: "/?v=hoje", tag: "resumo" };
    } else {
      const antes = maximos(lista.filter((s) => s.started_at < ini));
      const agora = maximos(treinos);
      const recordes = Object.keys(agora).filter((k) => antes[k] != null && agora[k] > antes[k]).length;
      const vol = treinos.reduce((n, s) => n + (Number(s.vol) || 0), 0);
      const tempo = semana.reduce((n, s) => n + (Number(s.dur_s) || 0), 0);
      const partes = [
        vol ? `${toneladas(vol)} t levantadas` : "",
        tempo ? `${horasTxt(tempo)} de treino` : "",
        recordes ? `${recordes} ${recordes > 1 ? "recordes" : "recorde"}` : "",
        cardios ? `${cardios} cardio${cardios > 1 ? "s" : ""}` : "",
      ].filter(Boolean);
      msg = {
        title: `Sua semana: ${treinos.length} ${treinos.length === 1 ? "treino" : "treinos"} em ${dias} ${dias === 1 ? "dia" : "dias"} 🔥`,
        body: (partes.join(" · ") || "Semana registrada") + ". Toque para ver seu card.",
        url: "/?card=semana",
        tag: "resumo",
      };
    }
    if (previa) previa.push(msg); else enviados += await enviar([uid], msg);
  }
  return enviados;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("método", { status: 405 });
  let corpo: { tipo?: string; id?: string; previa?: boolean } = {};
  try { corpo = await req.json(); } catch { /* vazio */ }
  try {
    if (corpo.tipo === "setup") {
      await garantirVapid();
      return Response.json({ ok: true });
    }
    const s = await garantirVapid();
    if (corpo.tipo === "teste") {
      // chamado pelo app, com o login da pessoa: manda um aviso só para ela
      const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      const { data: u } = await sb.auth.getUser(jwt);
      if (!u?.user) return new Response("não autorizado", { status: 401, headers: CORS });
      const n = await enviar([u.user.id], { title: "Notificações ativadas ✅", body: "É assim que os avisos do Meus Treinos vão chegar.", url: "/", tag: "teste" });
      return Response.json({ ok: true, enviados: n }, { headers: CORS });
    }
    if (!iguais(req.headers.get("x-chave") || "", s.chave_interna || "")) return new Response("não autorizado", { status: 401 });
    let n = 0;
    if (corpo.tipo === "treino" && corpo.id) n = await treinoTerminado(corpo.id);
    else if (corpo.tipo === "reacao" && corpo.id) n = await reacao(corpo.id);
    else if (corpo.tipo === "lembretes") n = await lembretes();
    else if (corpo.tipo === "resumo" && corpo.previa) { const pv: Msg[] = []; await resumo(pv); return Response.json({ ok: true, previa: pv }); }
    else if (corpo.tipo === "resumo") n = await resumo();
    else return new Response("tipo", { status: 400 });
    return Response.json({ ok: true, enviados: n });
  } catch (e) {
    console.error("notificar", String((e as Error).message || e).slice(0, 300));
    return Response.json({ ok: false }, { status: 500, headers: CORS });
  }
});
