import { test } from 'node:test';

import assert from 'node:assert/strict';

import { readFile, readdir } from 'node:fs/promises';

import { existsSync } from 'node:fs';

import { fileURLToPath } from 'node:url';

import { execFileSync } from 'node:child_process';

import path from 'node:path';

import express from 'express';

import { runInNewContext } from 'node:vm';

import { esc, dinheiro, dataVenda, etiqueta, confirmarComSenha } from '../../frontend/compartilhado/interface.js';

import { api, salvarSessao, registros, protegerPagina } from '../../frontend/compartilhado/api.js';

const frontend = fileURLToPath(new URL('../../frontend/', import.meta.url));

const paginas = ['login', 'primeiro-acesso', 'dashboard', 'clientes', 'produtos', 'usuarios', 'empresas', 'vendas', 'nova-venda', 'detalhes-venda', 'venda-concluida', 'perfil', 'offline'];

test('todas as páginas têm HTML, CSS e JavaScript próprios e referências válidas', async () => {

    for (const pagina of paginas) {

        for (const extensao of ['html', 'css', 'js']) {

            assert.ok(existsSync(path.join(frontend, pagina, `${pagina}.${extensao}`)));

        }

        const html = await readFile(path.join(frontend, pagina, `${pagina}.html`), 'utf8');

        assert.match(html, /lang="pt-BR"/);

        assert.match(html, /name="viewport"/);

        assert.match(html, /type="module"/);

        assert.ok(!/[a-zA-ZÀ-ÿ]\?[a-zA-ZÀ-ÿ]/.test(html), 'Texto com acento corrompido: ' + pagina);

        for (const [, referencia] of html.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^"#]*)?"/g)) {

            if (referencia.startsWith('/') || referencia.includes(':')) continue;

            assert.ok(existsSync(path.resolve(frontend, pagina, referencia)), `${pagina}: ${referencia}`);

        }

    }

});

test('módulos JavaScript têm sintaxe e imports válidos', async () => {

    for (const diretorio of [...paginas, 'compartilhado']) {

        for (const nome of await readdir(path.join(frontend, diretorio))) {

            if (!nome.endsWith('.js')) continue;

            const arquivo = path.join(frontend, diretorio, nome);

            execFileSync(process.execPath, ['--check', arquivo]);

            const codigo = await readFile(arquivo, 'utf8');

            for (const [, referencia] of codigo.matchAll(/from ['"]([^'"]+)['"]/g)) {

                assert.ok(existsSync(path.resolve(path.dirname(arquivo), referencia)));

            }

        }

    }

});

test('arquivos são servidos por HTTP com tipos corretos sem expor o backend', async () => {

    const app = express();

    app.use('/app', express.static(frontend));

    const servidor = await new Promise(resolve => {

        const instancia = app.listen(0, '127.0.0.1', () => resolve(instancia));

    });

    try {

        const base = `http://127.0.0.1:${servidor.address().port}`;

        for (const pagina of paginas) {

            const resposta = await fetch(`${base}/app/${pagina}/${pagina}.html`);

            assert.equal(resposta.status, 200);

            assert.match(resposta.headers.get('content-type'), /text\/html/);

        }

        assert.match((await fetch(base + '/app/compartilhado/api.js')).headers.get('content-type'), /javascript/);

        assert.match((await fetch(base + '/app/manifest.webmanifest')).headers.get('content-type'), /manifest\+json/);

        assert.match((await fetch(base + '/app/service-worker.js')).headers.get('content-type'), /javascript/);

        assert.match((await fetch(base + '/app/icones/icone-192.png')).headers.get('content-type'), /image\/png/);

        assert.equal((await fetch(base + '/app/.env')).status, 404);

        assert.equal((await fetch(base + '/app/backend/.env')).status, 404);

    } finally {

        await new Promise(resolve => servidor.close(resolve));

    }

});

test('formatação brasileira e escape de conteúdo não confiável', () => {

    assert.equal(esc('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');

    assert.match(dinheiro(1250.5), /1\.250,50/);

    assert.equal(dataVenda('2026-09-15 12:00:00').toISOString(), '2026-09-15T12:00:00.000Z');

    assert.ok(!etiqueta('<script>').includes('<script>'));

    assert.deepEqual(registros({ produto: [{ id: 1 }] }), [{ id: 1 }]);

});

test('cliente HTTP usa token, trata expiração e preserva sessão na senha incorreta', async () => {

    const originalFetch = globalThis.fetch;

    const originalStorage = globalThis.sessionStorage;

    const originalLocation = globalThis.location;

    const armazenamento = new Map();

    const destinos = [];

    globalThis.sessionStorage = { getItem: chave => armazenamento.get(chave) ?? null, setItem: (chave, valor) => armazenamento.set(chave, valor), removeItem: chave => armazenamento.delete(chave) };

    globalThis.location = { assign: caminho => destinos.push(caminho), replace: caminho => destinos.push(caminho), pathname: '/app/dashboard/dashboard.html' };

    try {

        salvarSessao({ token: 'token-de-teste', escopo: 'empresa' });

        globalThis.fetch = async (caminho, opcoes) => {

            assert.equal(caminho, '/clientes');

            assert.equal(opcoes.headers.Authorization, 'Bearer token-de-teste');

            assert.equal(opcoes.method, 'POST');

            assert.equal(JSON.parse(opcoes.body).nome, 'Teste');

            return new Response(JSON.stringify({ dados: { id: 1 } }), { status: 201 });

        };

        assert.equal((await api('/clientes', { method: 'POST', body: { nome: 'Teste' } })).dados.id, 1);

        globalThis.fetch = async () => new Response(JSON.stringify({ mensagem: 'Senha incorreta.' }), { status: 401 });

        await assert.rejects(api('/usuarios/senha', { method: 'PATCH', manterSessao: true }), /Senha incorreta/);

        assert.equal(destinos.length, 0);

        await assert.rejects(api('/clientes'), /Senha incorreta/);

        assert.match(destinos.at(-1), /login/);

        assert.equal(armazenamento.size, 0);

        salvarSessao({ token: 'temporario', escopo: 'empresa', primeiro_acesso: true });

        assert.equal(await protegerPagina(), null);

        assert.match(destinos.at(-1), /primeiro-acesso/);

        globalThis.fetch = async () => { throw new Error('offline'); };

        await assert.rejects(api('/clientes'), /conectar/);

    } finally {

        globalThis.fetch = originalFetch;

        globalThis.sessionStorage = originalStorage;

        globalThis.location = originalLocation;

    }

});


test('manifesto, ícones e páginas permitem instalar ASR Systems', async () => {

    const manifesto = JSON.parse(await readFile(path.join(frontend, 'manifest.webmanifest'), 'utf8'));

    assert.equal(manifesto.name, 'ASR Systems');

    assert.equal(manifesto.display, 'standalone');

    assert.equal(manifesto.scope, '/app/');

    assert.ok(manifesto.start_url.startsWith(manifesto.scope));

    for (const tamanho of ['192x192', '512x512']) {

        assert.ok(manifesto.icons.some(icone => icone.sizes === tamanho && icone.purpose === 'any'));

    }

    assert.ok(manifesto.icons.some(icone => icone.purpose === 'maskable'));

    for (const icone of [...manifesto.icons, { src: 'icones/icone-180.png', sizes: '180x180' }]) {

        const png = await readFile(path.join(frontend, icone.src));

        assert.equal(png.subarray(1, 4).toString(), 'PNG');

        assert.equal(png.readUInt32BE(16) + 'x' + png.readUInt32BE(20), icone.sizes);

    }

    for (const pagina of paginas) {

        const html = await readFile(path.join(frontend, pagina, pagina + '.html'), 'utf8');

        assert.ok(html.includes('rel="manifest" href="/app/manifest.webmanifest"'));

        assert.match(html, /rel="apple-touch-icon"/);

        if (pagina !== 'offline') assert.ok(html.includes('src="/app/compartilhado/pwa.js"'));

    }

    execFileSync(process.execPath, ['--check', path.join(frontend, 'service-worker.js')]);

});

async function simularWorker() {

    const eventos = {};

    const armazenados = new Map();

    const removidos = [];

    let ativacoes = 0;

    let assumir = 0;

    let conectado = true;

    const cache = {

        async addAll(arquivos) {

            for (const arquivo of arquivos) {

                assert.ok(existsSync(path.join(frontend, arquivo.replace('/app/', ''))));

                armazenados.set(arquivo, new Response(arquivo));

            }

        },

        async match(requisicao) {

            const chave = typeof requisicao === 'string' ? requisicao : new URL(requisicao.url).pathname;

            return armazenados.get(chave)?.clone();

        },

    };

    runInNewContext(await readFile(path.join(frontend, 'service-worker.js'), 'utf8'), {

        URL, Response,

        self: {

            location: { origin: 'https://asr.test' },

            clients: { async claim() { assumir++; } },

            async skipWaiting() { ativacoes++; },

            addEventListener(nome, funcao) { eventos[nome] = funcao; },

        },

        caches: {

            async open() { return cache; },

            async keys() { return ['asr-pwa-v0', 'asr-pwa-v1', 'outro-app']; },

            async delete(nome) { removidos.push(nome); },

        },

        async fetch() {

            if (!conectado) throw new Error('offline');

            return new Response('rede');

        },

    });

    async function ciclo(nome, dados = {}) {

        let promessa;

        eventos[nome]({ ...dados, waitUntil(valor) { promessa = valor; } });

        await promessa;

    }

    function requisitar(caminho, { method = 'GET', mode = 'cors', headers = {} } = {}) {

        let resposta;

        eventos.fetch({ request: { url: new URL(caminho, 'https://asr.test').href, method, mode, headers: new Headers(headers) }, respondWith(valor) { resposta = valor; } });

        return resposta;

    }

    return { ciclo, requisitar, armazenados, removidos, desconectar() { conectado = false; }, get ativacoes() { return ativacoes; }, get assumir() { return assumir; } };

}

test('PWA instala apenas tela offline, preserva outros caches e atualiza mediante ação', async () => {

    const worker = await simularWorker();

    await worker.ciclo('install');

    assert.equal(worker.armazenados.size, 4);

    assert.equal(worker.ativacoes, 0);

    await worker.ciclo('activate');

    assert.deepEqual(worker.removidos, ['asr-pwa-v0']);

    assert.equal(worker.assumir, 1);

    await worker.ciclo('message', { data: { tipo: 'IGNORAR' } });

    assert.equal(worker.ativacoes, 0);

    await worker.ciclo('message', { data: { tipo: 'ATUALIZAR' } });

    assert.equal(worker.ativacoes, 1);

});

test('PWA não intercepta API nem escritas e oferece fallback para navegação offline', async () => {

    const worker = await simularWorker();

    await worker.ciclo('install');

    for (const rota of ['/vendas', '/usuarios/perfil', '/usuarios/login', '/administracao/perfil', '/clientes', '/produtos', '/empresas']) {

        assert.equal(worker.requisitar(rota), undefined);

        assert.equal(worker.requisitar(rota, { method: 'POST' }), undefined);

    }

    assert.equal(worker.requisitar('/app/login/login.html', { method: 'POST' }), undefined);

    assert.equal(worker.requisitar('/app/offline/offline.css', { headers: { Authorization: 'Bearer teste' } }), undefined);

    assert.equal(worker.requisitar('https://outro.test/app/offline/offline.css'), undefined);

    assert.equal(await (await worker.requisitar('/app/vendas/vendas.html', { mode: 'navigate' })).text(), 'rede');

    worker.desconectar();

    assert.equal(await (await worker.requisitar('/app/vendas/vendas.html?id=1', { mode: 'navigate' })).text(), '/app/offline/offline.html');

    assert.equal(await (await worker.requisitar('/app/offline/offline.css')).text(), '/app/offline/offline.css');

    assert.equal(worker.requisitar('/app/compartilhado/api.js'), undefined);

    assert.equal(worker.armazenados.size, 4);

});


test('confirmação com senha permite desistir, trata erro e impede envio duplicado', async () => {
    const anterior = globalThis.document;
    let dialogo;
    globalThis.document = {
        body: { append() {} },
        createElement() {
            const eventos = {};
            const campo = { value: '', focus() {} };
            const voltar = {};
            const confirmar = {};
            const form = {};
            const erro = {};
            dialogo = {
                campo, voltar, form, erro, eventos, removido: false,
                setAttribute() {}, showModal() {},
                addEventListener(nome, acao) { eventos[nome] = acao; },
                querySelector(seletor) { return ({input:campo, '[data-voltar]':voltar, form, '[data-erro]':erro})[seletor]; },
                querySelectorAll() { return [voltar, confirmar]; },
                close() { eventos.close(); },
                remove() { this.removido = true; },
            };
            return dialogo;
        },
    };
    try {
        let chamadas = 0;
        const cancelado = confirmarComSenha('Excluir?', 'Confirma?', () => { chamadas++; });
        dialogo.campo.value = 'senha não enviada';
        dialogo.voltar.onclick();
        assert.equal(await cancelado, false);
        assert.equal(chamadas, 0);
        assert.equal(dialogo.campo.value, '');
        let liberar;
        const resultado = confirmarComSenha('Excluir <script>?', 'Confirma?', async senha => {
            chamadas++;
            assert.equal(senha, chamadas === 1 ? 'errada' : 'correta');
            if (chamadas === 1) throw new Error('Senha incorreta.');
            await new Promise(resolve => { liberar = resolve; });
        });
        assert.ok(!dialogo.innerHTML.includes('<script>'));
        dialogo.campo.value = 'errada';
        await dialogo.form.onsubmit({preventDefault() {}});
        assert.equal(dialogo.removido, false);
        assert.equal(dialogo.erro.textContent, 'Senha incorreta.');
        assert.equal(dialogo.campo.value, '');
        dialogo.campo.value = 'correta';
        const envio = dialogo.form.onsubmit({preventDefault() {}});
        await dialogo.form.onsubmit({preventDefault() {}});
        assert.equal(chamadas, 2);
        assert.equal(dialogo.voltar.disabled, true);
        let bloqueado = false;
        dialogo.eventos.cancel({preventDefault() { bloqueado = true; }});
        assert.equal(bloqueado, true);
        liberar();
        await envio;
        assert.equal(await resultado, true);
        assert.equal(dialogo.campo.value, '');
        assert.equal(dialogo.removido, true);
    } finally { globalThis.document = anterior; }
});
