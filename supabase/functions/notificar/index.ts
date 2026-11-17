// Notificações no celular (Web Push) do Meus Treinos.
// Chamada pelo próprio banco (gatilhos e pg_cron) com a chave interna no cabeçalho x-chave.
//   {tipo:'treino', id}   -> avisa o grupo que alguém terminou o treino
//   {tipo:'reacao', id}   -> avisa quem recebeu a reação
//   {tipo:'lembretes'}    -> lembrete nos dias de treino, na hora escolhida
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

async function querem(usuarios: string[], chave: "grupo" | "reacoes" | "lembrete") {
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
  return enviar(await querem(outros, "grupo"), {
    title: cardio ? `${nome} fez cardio 🏃` : `${nome} terminou o treino 💪`,
    body: (cardio ? "Cardio registrado" : `Treino ${s.letter}${s.workout_name ? " · " + s.workout_name : ""}`) +
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

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("método", { status: 405 });
  let corpo: { tipo?: string; id?: string } = {};
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
    else return new Response("tipo", { status: 400 });
    return Response.json({ ok: true, enviados: n });
  } catch (e) {
    console.error("notificar", String((e as Error).message || e).slice(0, 300));
    return Response.json({ ok: false }, { status: 500, headers: CORS });
  }
});
