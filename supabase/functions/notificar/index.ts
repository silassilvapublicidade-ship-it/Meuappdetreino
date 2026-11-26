// Notificações no celular (Web Push) do Meus Treinos.
// Chamada pelo próprio banco (gatilhos e pg_cron) com a chave interna no cabeçalho x-chave.
//   {tipo:'treino', id}   -> avisa o grupo que alguém terminou o treino
//   {tipo:'reacao', id}   -> avisa quem recebeu a reação
//   {tipo:'lembretes'}    -> lembrete nos dias de treino, na hora escolhida
//   {tipo:'resumo'}       -> domingo à noite: resumo da semana de cada pessoa
//   {tipo:'aviso', id}    -> aviso publicado pelo admin vira notificação para todos
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

async function querem(usuarios: string[], chave: "grupo" | "reacoes" | "lembrete" | "resumo" | "avisos" | "sono" | "fotos" | "treino") {
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
  const aula = cardio && ["Spinning", "Jump", "Pump"].includes(s.workout_name);
  const icone = s.workout_name === "Spinning" ? "🚴" : s.workout_name === "Pump" ? "🏋️" : "🤸";
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

async function aviso(id: string) {
  const { data: a } = await sb.from("app_avisos").select("texto,nivel,ativo,created_by").eq("id", id).maybeSingle();
  if (!a || !a.ativo) return 0;
  const { data: subs } = await sb.from("push_subs").select("user_id");
  const todos = [...new Set((subs || []).map((x) => x.user_id))]; // inclusive quem publicou
  const titulo = a.nivel === "alerta" ? "⚠️ Atenção" : a.nivel === "festa" ? "🎉 Boa notícia" : "📣 Aviso do Meus Treinos";
  const texto = String(a.texto || "").trim();
  return enviar(await querem(todos, "avisos"), {
    title: titulo,
    body: texto.length > 180 ? texto.slice(0, 177) + "…" : texto,
    url: "/?v=hoje",
    tag: "aviso-" + id,
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
    const { data: ficha } = await sb.from("plans").select("treinos,cronograma").eq("user_id", p.id).eq("ativa", true).eq("extra", false).order("updated_at", { ascending: false }).limit(1).maybeSingle();
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

// Sono: aviso da hora de deitar (30 min antes) e lembrete de registrar de manhã
function hhmm(min: number) { min = ((min % 1440) + 1440) % 1440; return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0"); }
function naJanela(agora: number, alvo: number, largura = 30) { const d = ((agora - alvo) % 1440 + 1440) % 1440; return d < largura; }
async function sonoAvisos() {
  const agora = agoraLocal();
  const { data: subs } = await sb.from("push_subs").select("user_id");
  const ids = [...new Set((subs || []).map((x) => x.user_id))];
  if (!ids.length) return 0;
  const { data: perfis } = await sb.from("profiles").select("id,notif,sono_meta,sono_acordar,sono_deitar_ultimo,sono_manha_ultimo,sono_aberta").in("id", ids);
  let enviados = 0;
  for (const p of perfis || []) {
    if (p.notif && p.notif.sono === false) continue;
    const meta = p.sono_meta || 480;
    const acordar = p.sono_acordar ? (() => { const [h, m] = String(p.sono_acordar).split(":").map(Number); return h * 60 + m; })() : null;
    const aberta = p.sono_aberta && !p.sono_aberta.fechada && p.sono_aberta.dormiu;
    // noite: 30 min antes da hora ideal de deitar (se já marcou "Vou dormir", não avisa)
    if (acordar != null && !aberta && p.sono_deitar_ultimo !== agora.data) {
      const deitar = acordar - meta;
      if (naJanela(agora.min, deitar - 30)) {
        await sb.from("profiles").update({ sono_deitar_ultimo: agora.data }).eq("id", p.id);
        enviados += await enviar([p.id], {
          title: "Hora de desacelerar 🌙",
          body: `Para dormir ${Math.floor(meta / 60)}h${meta % 60 ? String(meta % 60).padStart(2, "0") : ""} e acordar às ${hhmm(acordar)}, deite às ${hhmm(deitar)}. Ao deitar, toque em "Vou dormir".`,
          url: "/?v=hoje",
          tag: "sono-noite",
        });
      }
    }
    // manhã: só para quem já usa o registro de sono e ainda não registrou hoje
    const alvoManha = acordar != null ? acordar + 90 : 9 * 60 + 30;
    if (p.sono_manha_ultimo !== agora.data && naJanela(agora.min, alvoManha)) {
      await sb.from("profiles").update({ sono_manha_ultimo: agora.data }).eq("id", p.id);
      const desde = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
      if (aberta) {
        enviados += await enviar([p.id], { title: "Bom dia! ☀️", body: "Você marcou \"Vou dormir\" ontem. Toque em \"Acordei\" para fechar a noite.", url: "/?acao=sono", tag: "sono-manha" });
        continue;
      }
      const { count: usa } = await sb.from("sono").select("dia", { count: "exact", head: true }).eq("user_id", p.id).gte("dia", desde);
      if (!usa) continue;
      const { count: hoje } = await sb.from("sono").select("dia", { count: "exact", head: true }).eq("user_id", p.id).eq("dia", agora.data);
      if (hoje) continue;
      enviados += await enviar([p.id], {
        title: "Como foi sua noite? 😴",
        body: "Registre o sono em segundos: toque em \"Acordei\" ou ajuste os horários.",
        url: "/?sono=registrar",
        tag: "sono-manha",
      });
    }
  }
  return enviados;
}

// Fotos do mês: dia 1, às 10h, para quem treina e não tira foto há mais de 25 dias
async function fotosMes() {
  const agora = agoraLocal();
  if (!agora.data.endsWith("-01") || !naJanela(agora.min, 10 * 60)) return 0;
  const { data: subs } = await sb.from("push_subs").select("user_id");
  const ids = await querem([...new Set((subs || []).map((x) => x.user_id))], "fotos");
  let enviados = 0;
  for (const uid of ids) {
    const { data: p } = await sb.from("profiles").select("fotos_aviso_ultimo").eq("id", uid).maybeSingle();
    if (p?.fotos_aviso_ultimo === agora.data) continue;
    await sb.from("profiles").update({ fotos_aviso_ultimo: agora.data }).eq("id", uid);
    const { count: treinos } = await sb.from("sessions").select("id", { count: "exact", head: true }).eq("user_id", uid);
    if ((treinos || 0) < 4) continue;
    const desde = new Date(Date.now() - 25 * 864e5).toISOString().slice(0, 10);
    const { count: recentes } = await sb.from("photos").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("d", desde);
    if (recentes) continue;
    enviados += await enviar([uid], { title: "Dia das fotos do mês 📸", body: "Frente, lado e costas, com a mesma luz de sempre. Em um mês dá para ver a diferença.", url: "/?acao=fotos", tag: "fotos-mes" });
  }
  return enviados;
}

// Treino esquecido aberto: rascunho parado há mais de 40 min recebe um aviso (uma vez por treino)
async function treinoAberto() {
  const limite = new Date(Date.now() - 40 * 60000).toISOString();
  const { data: rasc } = await sb.from("drafts").select("user_id,data,updated_at").lt("updated_at", limite);
  if (!rasc || !rasc.length) return 0;
  const ids = await querem(rasc.map((r) => r.user_id), "treino");
  const { data: perfis } = await sb.from("profiles").select("id,aviso_treino_aberto").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const visto = Object.fromEntries((perfis || []).map((p) => [p.id, p.aviso_treino_aberto]));
  const hora = (ms: number) => new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" }).format(new Date(ms));
  let enviados = 0;
  for (const r of rasc) {
    const d = r.data || {}, ini = Number(d.start) || 0;
    if (!ids.includes(r.user_id) || !ini || Number(visto[r.user_id]) === ini) continue;
    await sb.from("profiles").update({ aviso_treino_aberto: ini }).eq("id", r.user_id);
    const ult = Math.max(Number(d.at) || 0, Number(d.lastSetAt) || 0, ini);
    enviados += await enviar([r.user_id], {
      title: "Seu treino ainda está aberto ⏱️",
      body: `Treino ${d.letter || ""}${d.w?.name ? " · " + d.w.name : ""} começou às ${hora(ini)} e está parado desde as ${hora(ult)}. Toque para finalizar.`,
      url: "/?acao=finalizar",
      tag: "treino-aberto",
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
    else if (corpo.tipo === "aviso" && corpo.id) n = await aviso(corpo.id);
    else if (corpo.tipo === "lembretes") n = (await lembretes()) + (await sonoAvisos()) + (await fotosMes()) + (await treinoAberto());
    else if (corpo.tipo === "resumo" && corpo.previa) { const pv: Msg[] = []; await resumo(pv); return Response.json({ ok: true, previa: pv }); }
    else if (corpo.tipo === "resumo") n = await resumo();
    else return new Response("tipo", { status: 400 });
    return Response.json({ ok: true, enviados: n });
  } catch (e) {
    console.error("notificar", String((e as Error).message || e).slice(0, 300));
    return Response.json({ ok: false }, { status: 500, headers: CORS });
  }
});
