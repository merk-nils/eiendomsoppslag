// Service worker for appen: henter alltid nyeste utgave av siden når det er nett,
// og bruker lagret utgave bare når det ikke er nett. Kart og oppslag krever nett.
const LAGER = 'eiendomsoppslag-v2';
const SKALL = [
  './', './index.html', './fradelingstomter.js', './manifest.webmanifest',
  './ikon/ikon-192.png', './ikon/ikon-512.png', './ikon/apple-touch-icon.png', './ikon/favicon-32.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(LAGER).then(c => c.addAll(SKALL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(navn => Promise.all(navn.filter(n => n !== LAGER).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const egen = url.origin === self.location.origin;
  const leaflet = url.hostname === 'cdnjs.cloudflare.com';
  // Oppslag mot Kartverket, NVE, DiBK osv. går alltid rett på nett
  if (e.request.method !== 'GET' || (!egen && !leaflet)) return;
  // Nett først, så lagret kopi. Ny utgave lagres for neste gang uten nett.
  e.respondWith(fetch(e.request).then(svar => {
    if (svar.ok) { const kopi = svar.clone(); caches.open(LAGER).then(c => c.put(e.request, kopi)); }
    return svar;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
