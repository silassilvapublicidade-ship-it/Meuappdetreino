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
        .catch(() => caches.match('/', { ignoreVary: true }).then(m => m || new Response('<h1>Sem internet</h1><p>Abra o app uma vez com internet para usar offline.</p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })))
    );
    return;
  }

  // Arquivos do app (têm nome com versão): usa a cópia guardada, senão busca e guarda.
  if (url.pathname.startsWith('/assets/') || /\.(png|svg|ico|webmanifest|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req, { ignoreVary: true }).then(m => m || fetch(req).then(res => {
        if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
        return res;
      }))
    );
  }
});

// Notificações (Web Push): mostra o aviso e, ao tocar, abre ou traz o app para frente.
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: 'Meus Treinos', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Meus Treinos', {
    body: d.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: d.tag || 'mt',
    renotify: true,
    data: { url: d.url || '/' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const alvo = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(lista => {
    for (const c of lista) { if (new URL(c.url).origin === self.location.origin && 'focus' in c) return c.focus(); }
    return self.clients.openWindow ? self.clients.openWindow(alvo) : null;
  }));
});
