// Meus Treinos: abre mesmo sem internet (o app guarda os dados no aparelho e envia depois).
const CACHE = 'mt-app';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase e outros: direto na rede

  // Páginas: tenta a rede primeiro (versão nova), e usa a cópia guardada se estiver sem internet.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put('/', c)); } return res; })
        .catch(() => caches.match('/').then(m => m || new Response('<h1>Sem internet</h1><p>Abra o app uma vez com internet para usar offline.</p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })))
    );
    return;
  }

  // Arquivos do app (têm nome com versão): usa a cópia guardada, senão busca e guarda.
  if (url.pathname.startsWith('/assets/') || /\.(png|svg|ico|webmanifest|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(m => m || fetch(req).then(res => {
        if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
        return res;
      }))
    );
  }
});
