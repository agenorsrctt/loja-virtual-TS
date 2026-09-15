import { test } from 'node:test';

import assert from 'node:assert/strict';

import { readFile, readdir } from 'node:fs/promises';

import { execFileSync } from 'node:child_process';

import { fileURLToPath } from 'node:url';

import path from 'node:path';

import express from 'express';

const raiz = fileURLToPath(new URL('../', import.meta.url));

async function arquivos(diretorio) {

    const resultado = [];

    for (const entrada of await readdir(diretorio, { withFileTypes: true })) {

        const arquivo = path.join(diretorio, entrada.name);

        if (entrada.isDirectory()) resultado.push(...await arquivos(arquivo));

        else resultado.push(arquivo);

    }

    return resultado;

}

test('publicação preserva os caminhos do PWA e não copia arquivos privados', async () => {

    execFileSync(process.execPath, ['scripts/prepararFrontend.mjs'], { cwd: raiz });

    const publico = path.join(raiz, 'public');

    const copiados = await arquivos(publico);

    assert.ok(copiados.length > 40);

    for (const arquivo of copiados) {

        assert.ok(!/\.env|\.(db|sql|ts)$|node_modules/.test(path.relative(publico, arquivo)));

        const origem = path.join(raiz, '../frontend', path.relative(path.join(publico, 'app'), arquivo));

        assert.deepEqual(await readFile(arquivo), await readFile(origem));

    }

    const configuracao = JSON.parse(await readFile(path.join(raiz, 'vercel.json'), 'utf8'));

    assert.equal(configuracao.framework, 'express');

    assert.equal(configuracao.buildCommand, 'npm run build:vercel');

    const app = express();

    app.use(express.static(publico));

    const servidor = await new Promise(resolve => {

        const instancia = app.listen(0, '127.0.0.1', () => resolve(instancia));

    });

    try {

        const base = `http://127.0.0.1:${servidor.address().port}`;

        for (const caminho of ['/app/login/login.html', '/app/manifest.webmanifest', '/app/service-worker.js', '/app/compartilhado/api.js', '/app/offline/offline.html']) {

            assert.equal((await fetch(base + caminho)).status, 200);

        }

        for (const caminho of ['/.env', '/.env.turso', '/src/database/database.db', '/app/backend/.env']) {

            assert.equal((await fetch(base + caminho)).status, 404);

        }

    } finally {

        await new Promise(resolve => servidor.close(resolve));

    }

});
