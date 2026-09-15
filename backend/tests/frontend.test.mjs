import { test } from 'node:test';

import assert from 'node:assert/strict';

import { readFile, readdir } from 'node:fs/promises';

import { existsSync } from 'node:fs';

import { fileURLToPath } from 'node:url';

import { execFileSync } from 'node:child_process';

import path from 'node:path';

import express from 'express';

import { esc, dinheiro, dataVenda, etiqueta } from '../../frontend/compartilhado/interface.js';

import { api, salvarSessao, registros, protegerPagina } from '../../frontend/compartilhado/api.js';

const frontend = fileURLToPath(new URL('../../frontend/', import.meta.url));

const paginas = ['login', 'primeiro-acesso', 'dashboard', 'clientes', 'produtos', 'usuarios', 'empresas', 'vendas', 'nova-venda', 'detalhes-venda', 'venda-concluida', 'perfil'];

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
