// Notificações no celular (Web Push). O servidor manda; aqui só pedimos permissão e
// registramos este aparelho. A chave pública vem do banco (vapid_publica).
export function suportaPush(){
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}
export function ehIOS(){ return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
export function instalado(){ return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
export function permissao(){ return 'Notification' in window ? Notification.permission : 'unsupported'; }

function chaveBytes(b64){
  const pad = '='.repeat((4 - b64.length % 4) % 4);
  const bin = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}
async function registro(){
  const r = await navigator.serviceWorker.getRegistration();
  if(r) return r;
  return Promise.race([navigator.serviceWorker.ready, new Promise((_, rej) => setTimeout(() => rej(new Error('sem_sw')), 8000))]);
}
export async function assinaturaAtual(){
  if(!suportaPush()) return null;
  try{ const r = await registro(); return await r.pushManager.getSubscription(); }catch(e){ return null; }
}
// Pede permissão (precisa ser chamado num toque do usuário) e assina este aparelho.
export async function assinar(vapid){
  if(!suportaPush()) throw new Error('sem_suporte');
  const p = await Notification.requestPermission();
  if(p !== 'granted') throw new Error(p === 'denied' ? 'negado' : 'sem_resposta');
  const r = await registro();
  let s = await r.pushManager.getSubscription();
  if(s){
    // se a chave do servidor mudou, assina de novo
    const atual = s.options && s.options.applicationServerKey ? new Uint8Array(s.options.applicationServerKey) : null;
    const nova = chaveBytes(vapid);
    if(atual && (atual.length !== nova.length || atual.some((b, i) => b !== nova[i]))){ await s.unsubscribe(); s = null; }
  }
  if(!s) s = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveBytes(vapid) });
  return s.toJSON();
}
export async function cancelar(){
  const s = await assinaturaAtual();
  if(!s) return null;
  const ep = s.endpoint;
  try{ await s.unsubscribe(); }catch(e){}
  return ep;
}
