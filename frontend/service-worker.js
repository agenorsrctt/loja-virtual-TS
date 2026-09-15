const CACHE = 'asr-pwa-v1';

const OFFLINE = '/app/offline/offline.html';

const ARQUIVOS = [
    OFFLINE,
    '/app/offline/offline.css',
    '/app/offline/offline.js',
    '/app/icones/icone-192.png',
];

self.addEventListener('install', evento => {

    evento.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ARQUIVOS)));

});

self.addEventListener('activate', evento => {

    evento.waitUntil((async () => {

        const nomes = await caches.keys();

        await Promise.all(nomes.filter(nome => nome.startsWith('asr-pwa-') && nome !== CACHE).map(nome => caches.delete(nome)));

        await self.clients.claim();

    })());

});

self.addEventListener('message', evento => {

    if (evento.data?.tipo === 'ATUALIZAR') {

        evento.waitUntil(self.skipWaiting());

    }

});

self.addEventListener('fetch', evento => {

    const requisicao = evento.request;

    const url = new URL(requisicao.url);

    // A API, credenciais e operações de escrita nunca entram no cache.
    if (requisicao.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith('/app/') || requisicao.headers.has('Authorization')) {

        return;

    }

    if (requisicao.mode === 'navigate') {

        evento.respondWith(fetch(requisicao).catch(async () => {

            const cache = await caches.open(CACHE);

            return await cache.match(OFFLINE) || Response.error();

        }));

        return;

    }

    if (ARQUIVOS.includes(url.pathname) && !url.search) {

        evento.respondWith((async () => {

            const cache = await caches.open(CACHE);

            return await cache.match(requisicao) || fetch(requisicao);

        })());

    }

});
