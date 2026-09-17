import assert from "node:assert/strict";

import { test } from "node:test";

import { mkdtemp, readFile, rm } from "node:fs/promises";

import { readFileSync } from "node:fs";

import { tmpdir } from "node:os";

import path from "node:path";

import { fileURLToPath, pathToFileURL } from "node:url";

import { stripTypeScriptTypes, createRequire } from "node:module";

import { SourceTextModule, SyntheticModule } from "node:vm";

import sqlite3 from "sqlite3";

import express from "express";

import jwt from "jsonwebtoken";

const require = createRequire(import.meta.url);

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("vendas e itens vendidos: integração HTTP e transações isoladas", async (t) => {

    const pasta = await mkdtemp(path.join(tmpdir(), "loja-vendas-"));

    const arquivoBanco = path.join(pasta, "teste.db");

    const db = new sqlite3.Database(arquivoBanco);

    const ambienteBanco = Object.fromEntries(['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'SQLITE_PATH', 'VERCEL'].map(nome => [nome, process.env[nome]]));

    for (const nome of Object.keys(ambienteBanco)) delete process.env[nome];

    const usarTurso = process.env.ASR_TESTE_TURSO === '1';

    let bancoLibsql;

    if (usarTurso) {

        process.env.TURSO_DATABASE_URL = 'libsql://banco-isolado.invalid';

        process.env.TURSO_AUTH_TOKEN = 'token-apenas-do-teste';

    }

    const segredoAnterior = process.env.JWT_SECRET;

    process.env.JWT_SECRET = "segredo-exclusivo-dos-testes";

    const executar = (sql, valores = []) => new Promise((resolve, reject) => {

        db.run(sql, valores, (erro) => erro ? reject(erro) : resolve());

    });

    const buscar = (sql, valores = []) => new Promise((resolve, reject) => {

        db.get(sql, valores, (erro, registro) => erro ? reject(erro) : resolve(registro));

    });

    const sintetico = (valor) => new SyntheticModule(["default"], function () {

        this.setExport("default", valor);

    });

    class BancoTeste extends sqlite3.Database {

        constructor(_arquivo, callback) {

            super(arquivoBanco, callback);

        }

    }

    let moduloBanco = sintetico(db);

    const moduloSqlite = sintetico({ ...sqlite3, Database: BancoTeste });

    const modulos = new Map();

    const pacotes = new Map();

    async function carregar(arquivo) {

        if (modulos.has(arquivo)) {

            return modulos.get(arquivo);

        }

        const carregamento = Promise.resolve().then(async () => {

            const codigo = stripTypeScriptTypes(readFileSync(arquivo, "utf8"), { mode: "transform" });

            const modulo = new SourceTextModule(codigo, {
                identifier: arquivo,
                importModuleDynamically: async referencia => {
                    if (referencia !== 'sqlite3') throw new Error(`Importação dinâmica inesperada: ${referencia}`);
                    if (moduloSqlite.status === 'unlinked') await moduloSqlite.link(() => {});
                    await moduloSqlite.evaluate();
                    return moduloSqlite;
                },
            });

            await modulo.link(async (referencia, origem) => {

                if (referencia.endsWith("/database/connection.js")) {

                    return moduloBanco;

                }

                if (referencia === "sqlite3") {

                    return moduloSqlite;

                }

                if (!referencia.startsWith(".")) {

                    if (!pacotes.has(referencia)) {

                        const pacote = referencia === '@libsql/client/web' && usarTurso ? { ...require(referencia), createClient: () => bancoLibsql } : require(referencia);

                        const nomes = [...new Set(["default", ...Object.keys(pacote)])];

                        pacotes.set(referencia, new SyntheticModule(nomes, function () {

                            this.setExport("default", pacote);

                            for (const nome of nomes.filter(nome => nome !== "default")) this.setExport(nome, pacote[nome]);

                        }));

                    }

                    return pacotes.get(referencia);

                }

                return carregar(path.resolve(path.dirname(origem.identifier), referencia.replace(/\.js$/, ".ts")));

            });

            return modulo;

        });

        modulos.set(arquivo, carregamento);

        return carregamento;

    }

    if (usarTurso) {

        bancoLibsql = require('@libsql/client').createClient({ url: pathToFileURL(arquivoBanco).href, intMode: 'number', concurrency: 1 });

        await bancoLibsql.execute('PRAGMA foreign_keys = ON');

        const adaptador = await carregar(path.join(raiz, 'src/database/turso.ts'));

        await adaptador.evaluate();

        moduloBanco = sintetico(new adaptador.namespace.BancoTurso(bancoLibsql));

    }

    let servidor;

    try {

        await executar("PRAGMA foreign_keys = ON");

        const init = await readFile(path.join(raiz, "src/database/esquema.ts"), "utf8");

        const tabelas = [...init.matchAll(/executarSQL\(db, `(CREATE TABLE[\s\S]*?)`\)/g)];

        assert.equal(tabelas.length, 9);

        for (const [, sql] of tabelas) {

            // Exercita a migração a partir da estrutura anterior, também no adaptador Turso.
            await executar(sql.replace("        comentarios TEXT NOT NULL DEFAULT '',\n", '').replace('        produto_id INTEGER,\n        descricao TEXT,', '        produto_id INTEGER NOT NULL,'));

        }

        await executar("INSERT INTO EMPRESAS(id, empresa, cnpj, status) VALUES(1, 'Loja A', '1', 'ativo'), (2, 'Loja B', '2', 'ativo')");

        await executar("INSERT INTO USUARIOS(id, empresa_id, nome, tipo, email, status, senha) VALUES(1, 1, 'A', 'admin', 'a@teste.com', 'ativo', 'teste'), (2, 2, 'B', 'admin', 'b@teste.com', 'ativo', 'teste')");

        await executar("INSERT INTO CLIENTES(id, empresa_id, nome, telefone, status) VALUES(1, 1, 'A', '111', 'ativo'), (2, 2, 'B', '222', 'ativo'), (3, 1, 'C', '333', 'inativo')");

        await executar("INSERT INTO PRODUTOS(id, empresa_id, produto, estoque, preco, status) VALUES(1, 1, 'P1', 10, 10.15, 'ativo'), (2, 1, 'P2', 5, 0.10, 'ativo'), (3, 2, 'P3', 10, 1, 'ativo'), (4, 1, 'P4', 1, 20, 'ativo'), (5, 1, 'P5', 10, 1, 'inativo')");

        const migracao = await carregar(path.join(raiz, "src/database/migrarAcesso.ts"));

        await migracao.evaluate();

        await migracao.namespace.migrarAcesso();

        const migracaoCondicoes = await carregar(path.join(raiz, "src/database/migrarCondicoesVenda.ts"));
        await migracaoCondicoes.evaluate();
        await migracaoCondicoes.namespace.migrarCondicoesVenda();
        await migracaoCondicoes.namespace.migrarCondicoesVenda();
        const hashExclusao = await require('bcrypt').hash('senha de exclusao', 4);
        await executar('UPDATE USUARIOS SET senha = ?', [hashExclusao]);
        await executar("INSERT INTO SUPER_ADMIN(id, email, senha) VALUES(1, 'dono@exclusao.test', ?)", [hashExclusao]);
        const app = express();

        app.use(express.json());

        for (const [rota, arquivo] of [["/vendas", "vendas/routes/vendas.routes.ts"], ["/itens-vendidos", "itens_vendidos/routes/itensVendidos.routes.ts"], ["/produtos", "produtos/routes/produtos.routes.ts"], ["/clientes", "clientes/routes/clientes.routes.ts"], ["/usuarios", "usuarios/routes/usuarios.routes.ts"], ["/empresas", "empresas/routes/empresas.routes.ts"]]) {

            const modulo = await carregar(path.join(raiz, "src/modules", arquivo));

            await modulo.evaluate();

            app.use(rota, modulo.namespace.default);

        }

        servidor = await new Promise((resolve) => {

            const instancia = app.listen(0, "127.0.0.1", () => resolve(instancia));

        });

        const base = `http://127.0.0.1:${servidor.address().port}`;

        async function requisitar(metodo, rota, dados, empresa = 1, senhaPadrao = true) {

            if (senhaPadrao && metodo === 'DELETE' && !rota.endsWith('/excluir')) dados = {...(dados || {}), senha_atual: 'senha de exclusao'};
            const headers = { "Content-Type": "application/json" };

            if (empresa) {

                headers.Authorization = "Bearer " + jwt.sign({ id: empresa === 'superadmin' ? 1 : empresa, empresa_id: empresa, email: "teste@teste.com", tipo: "admin", escopo: empresa === "superadmin" ? "superadmin" : "empresa", finalidade: "acesso", versao_token: 0 }, process.env.JWT_SECRET, { expiresIn: "1h" });

            }

            const resposta = await fetch(base + rota, { method: metodo, headers, ...(dados === undefined ? {} : { body: JSON.stringify(dados) }) });

            return { status: resposta.status, corpo: await resposta.json() };

        }

        const dadosVenda = { cliente_id: 1, itens: [{ produto_id: 1, quantidade: 2 }, { produto_id: 2, quantidade: 3 }] };

        let venda;

        await t.test("autenticação e listas vazias", async () => {

            assert.equal((await requisitar("GET", "/vendas", undefined, 0)).status, 401);

            assert.equal((await requisitar("GET", "/itens-vendidos", undefined, 0)).status, 401);

            assert.deepEqual((await requisitar("GET", "/vendas")).corpo.dados, []);

            assert.deepEqual((await requisitar("GET", "/itens-vendidos")).corpo.dados, []);

        });

        await t.test("criação calcula preços, total e estoque sem aceitar IDs e valores forjados", async () => {

            const resposta = await requisitar("POST", "/vendas", { ...dadosVenda, empresa_id: 2, usuario_id: 2, valor_total: 1, status: "cancelado" });

            assert.equal(resposta.status, 201);

            venda = resposta.corpo.dados;

            assert.equal(venda.empresa_id, 1);

            assert.equal(venda.usuario_id, 1);

            assert.equal(venda.status, "pendente");

            assert.equal(venda.valor_total, 20.6);

            assert.ok(venda.data);

            assert.equal(venda.itens.length, 2);

            assert.equal(venda.itens[0].valor_vendido, 10.15);

            assert.equal((await buscar("SELECT estoque FROM PRODUTOS WHERE id = 1")).estoque, 8);

            assert.equal((await buscar("SELECT estoque FROM PRODUTOS WHERE id = 2")).estoque, 2);

        });

        await t.test("consultas de venda, itens e filtro", async () => {

            assert.deepEqual((await requisitar("GET", `/vendas/${venda.id}`)).corpo.dados, venda);

            assert.equal((await requisitar("GET", "/vendas")).corpo.dados.length, 1);

            assert.deepEqual((await requisitar("GET", `/itens-vendidos?venda_id=${venda.id}`)).corpo.dados, venda.itens);

            assert.deepEqual((await requisitar("GET", `/itens-vendidos/${venda.itens[0].id}`)).corpo.dados, venda.itens[0]);

        });

        await t.test("isolamento entre empresas e registros inexistentes", async () => {

            assert.deepEqual((await requisitar("GET", "/vendas", undefined, 2)).corpo.dados, []);

            assert.deepEqual((await requisitar("GET", `/itens-vendidos?venda_id=${venda.id}`, undefined, 2)).corpo.dados, []);

            for (const metodo of ["GET", "PATCH", "DELETE"]) {

                assert.equal((await requisitar(metodo, `/vendas/${venda.id}`, metodo === "PATCH" ? { cliente_id: 2 } : undefined, 2)).status, 404);

                assert.equal((await requisitar(metodo, "/vendas/999", metodo === "PATCH" ? { cliente_id: 1 } : undefined)).status, 404);

            }

            assert.equal((await requisitar("GET", `/itens-vendidos/${venda.itens[0].id}`, undefined, 2)).status, 404);

            assert.equal((await requisitar("POST", "/vendas", { ...dadosVenda, cliente_id: 2 })).status, 404);

            assert.equal((await requisitar("POST", "/vendas", { cliente_id: 1, itens: [{ produto_id: 3, quantidade: 1 }] })).status, 404);

        });

        await t.test("validação de corpo, IDs, quantidades e duplicatas", async () => {

            const invalidos = [undefined, [], {}, { ...dadosVenda, cliente_id: 0 }, { ...dadosVenda, itens: [] }, { ...dadosVenda, itens: null }];

            for (const quantidade of [0, -1, 1.5, "2", null, Number.MAX_SAFE_INTEGER + 1]) {

                invalidos.push({ cliente_id: 1, itens: [{ produto_id: 1, quantidade }] });

            }

            invalidos.push({ cliente_id: 1, itens: [{ produto_id: 1, quantidade: 1 }, { produto_id: 1, quantidade: 1 }] });

            for (const dados of invalidos) {

                assert.equal((await requisitar("POST", "/vendas", dados)).status, 400);

            }

            for (const id of ["abc", "0", "-1", "1.5"]) {

                assert.equal((await requisitar("GET", `/vendas/${id}`)).status, 400);

                assert.equal((await requisitar("GET", `/itens-vendidos/${id}`)).status, 400);

                assert.equal((await requisitar("GET", `/itens-vendidos?venda_id=${id}`)).status, 400);

            }

            assert.equal((await requisitar("PATCH", `/vendas/${venda.id}`, {})).status, 400);

            assert.equal((await requisitar("PATCH", `/vendas/${venda.id}`, { itens: [] })).status, 400);

        });

        await t.test("inativos e rollback quando um item falha após a primeira baixa", async () => {

            assert.equal((await requisitar("POST", "/vendas", { ...dadosVenda, cliente_id: 3 })).status, 409);

            assert.equal((await requisitar("POST", "/vendas", { cliente_id: 1, itens: [{ produto_id: 5, quantidade: 1 }] })).status, 409);

            await executar("UPDATE USUARIOS SET status = 'inativo' WHERE id = 1");

            assert.equal((await requisitar("POST", "/vendas", dadosVenda)).status, 401);

            await executar("UPDATE USUARIOS SET status = 'ativo' WHERE id = 1");

            const resposta = await requisitar("POST", "/vendas", { cliente_id: 1, itens: [{ produto_id: 1, quantidade: 1 }, { produto_id: 2, quantidade: 999 }] });

            assert.equal(resposta.status, 409);

            assert.equal((await buscar("SELECT COUNT(*) AS total FROM VENDAS")).total, 1);

            assert.equal((await buscar("SELECT COUNT(*) AS total FROM ITENS_VENDIDOS")).total, 2);

            assert.equal((await buscar("SELECT estoque FROM PRODUTOS WHERE id = 1")).estoque, 8);

        });

        await t.test("alteração preserva dados em falha e substitui itens de forma atômica", async () => {

            assert.equal((await requisitar("PATCH", `/vendas/${venda.id}`, { itens: [{ produto_id: 1, quantidade: 999 }] })).status, 409);

            assert.deepEqual((await requisitar("GET", `/vendas/${venda.id}`)).corpo.dados, venda);

            assert.equal((await buscar("SELECT estoque FROM PRODUTOS WHERE id = 1")).estoque, 8);

            const resposta = await requisitar("PATCH", `/vendas/${venda.id}`, { itens: [{ produto_id: 1, quantidade: 3 }] });

            assert.equal(resposta.status, 200);

            assert.equal(resposta.corpo.dados.valor_total, 30.45);

            assert.equal(resposta.corpo.dados.itens.length, 1);

            assert.equal((await buscar("SELECT estoque FROM PRODUTOS WHERE id = 1")).estoque, 7);

            assert.equal((await buscar("SELECT estoque FROM PRODUTOS WHERE id = 2")).estoque, 5);

        });

        await t.test("cancelamentos simultâneos devolvem o estoque uma única vez", async () => {

            const respostas = await Promise.all([requisitar("DELETE", `/vendas/${venda.id}`), requisitar("DELETE", `/vendas/${venda.id}`)]);

            assert.deepEqual(respostas.map((r) => r.status), [200, 200]);

            assert.equal((await buscar("SELECT estoque FROM PRODUTOS WHERE id = 1")).estoque, 10);

            assert.equal((await requisitar("GET", `/vendas/${venda.id}`)).corpo.dados.status, "cancelado");

            assert.equal((await requisitar("PATCH", `/vendas/${venda.id}`, { cliente_id: 1 })).status, 409);

            assert.equal((await requisitar("GET", `/itens-vendidos?venda_id=${venda.id}`)).corpo.dados.length, 1);

        });

        await t.test("duas vendas simultâneas não vendem o mesmo estoque", async () => {

            const dados = { cliente_id: 1, itens: [{ produto_id: 4, quantidade: 1 }] };

            const respostas = await Promise.all([requisitar("POST", "/vendas", dados), requisitar("POST", "/vendas", dados)]);

            assert.deepEqual(respostas.map((r) => r.status).sort(), [201, 409]);

            assert.equal((await buscar("SELECT estoque FROM PRODUTOS WHERE id = 4")).estoque, 0);

        });

        await t.test("preço vendido é histórico e falhas de banco não expõem detalhes", async () => {

            const criada = await requisitar("POST", "/vendas", { cliente_id: 1, itens: [{ produto_id: 1, quantidade: 1 }] });

            await executar("UPDATE PRODUTOS SET preco = 99 WHERE id = 1");

            assert.equal((await requisitar("GET", `/vendas/${criada.corpo.dados.id}`)).corpo.dados.itens[0].valor_vendido, 10.15);

            await executar("CREATE TRIGGER falha_item BEFORE INSERT ON ITENS_VENDIDOS BEGIN SELECT RAISE(ABORT, 'falha interna simulada'); END");

            const original = console.error;

            console.error = () => {};

            try {

                const resposta = await requisitar("POST", "/vendas", { cliente_id: 1, itens: [{ produto_id: 1, quantidade: 1 }] });

                assert.equal(resposta.status, 500);

                assert.deepEqual(resposta.corpo, { mensagem: "Erro interno do servidor." });

                assert.equal((await buscar("SELECT estoque FROM PRODUTOS WHERE id = 1")).estoque, 9);

            } finally {

                console.error = original;

                await executar("DROP TRIGGER falha_item");

            }

        });

        await t.test("pagamento é isolado, idempotente e cancelamento devolve estoque uma única vez", async () => {

            const estoque = (await buscar("SELECT estoque FROM PRODUTOS WHERE id = 1")).estoque;

            const criada = await requisitar("POST", "/vendas", { cliente_id: 1, itens: [{ produto_id: 1, quantidade: 1 }] });

            assert.equal(criada.status, 201);

            const id = criada.corpo.dados.id;

            assert.equal((await requisitar("PATCH", `/vendas/${id}/pagar`, {}, 2)).status, 404);

            assert.equal((await requisitar("PATCH", `/vendas/${id}/pagar`)).corpo.dados.status, "pago");

            assert.equal((await requisitar("PATCH", `/vendas/${id}/pagar`)).corpo.dados.status, "pago");

            assert.equal((await buscar("SELECT estoque FROM PRODUTOS WHERE id = 1")).estoque, estoque - 1);

            assert.equal((await requisitar("PATCH", `/vendas/${id}`, dadosVenda)).status, 409);

            assert.equal((await requisitar("DELETE", `/vendas/${id}`)).corpo.dados.status, "cancelado");

            await requisitar("DELETE", `/vendas/${id}`);

            assert.equal((await buscar("SELECT estoque FROM PRODUTOS WHERE id = 1")).estoque, estoque);

            assert.equal((await requisitar("PATCH", `/vendas/${id}/pagar`)).status, 409);

        });

        await t.test("itens avulsos, entrada, parcelas e recebimentos parciais", async () => {
            const produtos = await buscar("SELECT COUNT(*) AS n FROM PRODUTOS");
            const criada = await requisitar("POST", "/vendas", { cliente_id: 1, comentarios: 'Entregar no próximo ciclo', entrada: 10,
                parcelamento: { quantidade: 3, primeiro_vencimento: '2026-01-31' },
                itens: [{ descricao: 'Produto exclusivo', valor_unitario: 50.01, quantidade: 2 }] });
            assert.equal(criada.status, 201);
            const v = criada.corpo.dados;
            assert.equal(v.itens[0].produto_id, null);
            assert.equal(v.itens[0].descricao, 'Produto exclusivo');
            assert.equal(v.valor_total, 100.02);
            assert.equal(v.valor_pago, 10);
            assert.equal(v.saldo, 90.02);
            assert.deepEqual(v.parcelas.map(p => p.valor), [30.01, 30.01, 30]);
            assert.deepEqual(v.parcelas.map(p => p.vencimento), ['2026-01-31', '2026-02-28', '2026-03-31']);
            assert.deepEqual(await buscar("SELECT COUNT(*) AS n FROM PRODUTOS"), produtos);
            const rota = '/vendas/' + v.id;
            assert.equal((await requisitar('PATCH', rota + '/pagar', {valor: 1}, 2)).status, 404);
            assert.equal((await requisitar('PATCH', rota + '/pagar', {valor: 100})).status, 400);
            for (const valor of [0, -1, 1.001, '5']) assert.equal((await requisitar('PATCH', rota + '/pagar', {valor})).status, 400);
            const parcial = (await requisitar('PATCH', rota + '/pagar', {valor: 15})).corpo.dados;
            assert.equal(parcial.status, 'pendente');
            assert.equal(parcial.valor_pago, 25);
            assert.equal(parcial.saldo, 75.02);
            assert.equal(parcial.parcelas[0].saldo, 15.01);
            assert.equal(parcial.parcelas[1].saldo, 30.01);
            const listada = (await requisitar('GET', '/vendas')).corpo.dados.find(x => x.id === v.id);
            assert.equal(listada.valor_pago, 25);
            assert.equal(listada.saldo, 75.02);
            assert.equal(listada.pagamentos.length, 2);
            assert.ok(!(await requisitar('GET', '/vendas', undefined, 2)).corpo.dados.some(x => x.id === v.id));
            assert.equal((await requisitar('PATCH', rota, {itens: [{descricao: 'Outro', valor_unitario: 1, quantidade: 1}]})).status, 409);
            assert.equal((await requisitar('PATCH', rota, {comentarios: 'Novo comentário'})).corpo.dados.comentarios, 'Novo comentário');
            const paga = (await requisitar('PATCH', rota + '/pagar', {valor: 75.02})).corpo.dados;
            assert.equal(paga.status, 'pago');
            assert.equal(paga.saldo, 0);
            assert.ok(paga.parcelas.every(p => p.saldo === 0));
            assert.equal(paga.pagamentos.length, 3);
            assert.equal((await requisitar('PATCH', rota + '/pagar')).corpo.dados.pagamentos.length, 3);
            assert.equal((await requisitar('DELETE', rota)).corpo.dados.status, 'cancelado');
            assert.equal((await requisitar('GET', rota)).corpo.dados.pagamentos.length, 3);
        });
        await t.test("validações e rollback de condições de venda", async () => {
            const base = {cliente_id: 1, itens: [{descricao: 'Avulso', valor_unitario: 10, quantidade: 1}]};
            const antes = await buscar('SELECT COUNT(*) AS n FROM VENDAS');
            for (const extra of [{entrada: 11}, {entrada: -1}, {comentarios: 123}, {comentarios: 'x'.repeat(2001)},
                {parcelamento: {quantidade: 0, primeiro_vencimento: '2026-01-01'}},
                {parcelamento: {quantidade: 2, primeiro_vencimento: '2026-02-30'}},
                {entrada: 10, parcelamento: {quantidade: 2, primeiro_vencimento: '2026-01-01'}},
                {itens: [{descricao: '', valor_unitario: 1, quantidade: 1}]},
                {itens: [{descricao: 'A', valor_unitario: 0.001, quantidade: 1}]}]) {
                assert.equal((await requisitar('POST', '/vendas', {...base, ...extra})).status, 400);
            }
            assert.deepEqual(await buscar('SELECT COUNT(*) AS n FROM VENDAS'), antes);
            const criada = (await requisitar('POST', '/vendas', base)).corpo.dados;
            const rota = '/vendas/' + criada.id;
            const resultados = await Promise.all([requisitar('PATCH', rota + '/pagar', {valor: 7}), requisitar('PATCH', rota + '/pagar', {valor: 7})]);
            assert.deepEqual(resultados.map(r => r.status).sort(), [200, 400]);
            assert.equal((await requisitar('GET', rota)).corpo.dados.saldo, 3);
            const quitada = (await requisitar('POST', '/vendas', {...base, entrada: 10})).corpo.dados;
            assert.equal(quitada.status, 'pago');
            assert.equal(quitada.saldo, 0);
        });

        await t.test("migração preserva itens históricos e reconhece vendas antigas pagas", async () => {
            await executar("DELETE FROM MIGRACOES WHERE nome = 'asr_schema_v3_vendas'");
            await executar("INSERT INTO VENDAS(empresa_id, usuario_id, cliente_id, valor_total, status) VALUES(1, 1, 1, 12.34, 'pago')");
            const antiga = await buscar('SELECT MAX(id) AS id FROM VENDAS');
            await executar('INSERT INTO ITENS_VENDIDOS(venda_id, produto_id, empresa_id, valor_vendido, quantidade) VALUES(?, 1, 1, 12.34, 1)', [antiga.id]);
            await migracaoCondicoes.namespace.migrarCondicoesVenda();
            await migracaoCondicoes.namespace.migrarCondicoesVenda();
            const v = (await requisitar('GET', '/vendas/' + antiga.id)).corpo.dados;
            assert.equal(v.valor_pago, 12.34);
            assert.equal(v.saldo, 0);
            assert.equal(v.pagamentos.length, 1);
            assert.equal(v.itens[0].valor_vendido, 12.34);
        });
        await t.test("exclusão exige senha do ator, respeita vínculos e isola empresas", async () => {
            const senha = {senha_atual: 'senha de exclusao'};
            for (const rota of ['/clientes/1/excluir', '/produtos/1/excluir', '/usuarios/1/excluir', '/vendas/1/excluir']) {
                assert.equal((await requisitar('DELETE', rota)).status, 400);
                assert.equal((await requisitar('DELETE', rota, {senha_atual: 'incorreta'})).status, 403);
                assert.equal((await requisitar('DELETE', rota, senha, 0)).status, 401);
                assert.equal((await requisitar('DELETE', rota, senha, 2)).status, 404);
            }
            for (const rota of ['/clientes/1', '/produtos/1', '/usuarios/1', '/vendas/1']) {
                assert.equal((await requisitar('DELETE', rota, {}, 1, false)).status, 400);
                assert.equal((await requisitar('DELETE', rota, {senha_atual: 'errada'}, 1, false)).status, 403);
            }
            assert.equal((await requisitar('DELETE', '/empresas/1', {}, 'superadmin', false)).status, 400);
            assert.equal((await requisitar('DELETE', '/empresas/1/excluir', senha)).status, 403);
            assert.equal((await requisitar('DELETE', '/empresas/1/excluir', {}, 'superadmin')).status, 400);
            assert.equal((await requisitar('DELETE', '/empresas/1/excluir', {senha_atual: 'incorreta'}, 'superadmin')).status, 403);
            for (const rota of ['/clientes/1/excluir', '/produtos/1/excluir', '/usuarios/1/excluir']) assert.equal((await requisitar('DELETE', rota, senha)).status, 409);
            await executar("INSERT INTO CLIENTES(id, empresa_id, nome, telefone, status) VALUES(80, 1, 'Excluir', 'excluir', 'ativo')");
            await executar("INSERT INTO PRODUTOS(id, empresa_id, produto, estoque, preco, status) VALUES(80, 1, 'Excluir', 0, 1, 'ativo')");
            await executar("INSERT INTO USUARIOS(id, empresa_id, nome, tipo, email, status, senha) VALUES(80, 1, 'Excluir', 'colaborador', 'excluir@teste', 'ativo', 'hash do alvo')");
            for (const [entidade, tabela] of [['clientes','CLIENTES'],['produtos','PRODUTOS'],['usuarios','USUARIOS']]) {
                assert.equal((await requisitar('DELETE', '/' + entidade + '/80/excluir', senha)).status, 200);
                assert.equal(await buscar('SELECT id FROM ' + tabela + ' WHERE id = 80'), undefined);
                assert.equal((await requisitar('DELETE', '/' + entidade + '/80/excluir', senha)).status, 404);
            }
            assert.equal((await requisitar('DELETE', '/usuarios/2/excluir', senha, 2)).status, 409);
            await executar("UPDATE USUARIOS SET tipo = 'colaborador' WHERE id = 2");
            assert.equal((await requisitar('DELETE', '/usuarios/2/excluir', senha, 2)).status, 403);
            await executar("UPDATE USUARIOS SET tipo = 'admin' WHERE id = 2");
        });
        await t.test("exclusão de venda limpa parcelas e pagamentos e devolve estoque uma vez", async () => {
            const senha = {senha_atual: 'senha de exclusao'};
            const estoque = (await buscar('SELECT estoque FROM PRODUTOS WHERE id = 1')).estoque;
            const criada = (await requisitar('POST', '/vendas', {cliente_id: 1, entrada: 1, parcelamento: {quantidade: 2, primeiro_vencimento: '2026-10-10'}, itens: [{produto_id: 1, quantidade: 1}, {descricao:'Avulso', quantidade:1, valor_unitario:10}]})).corpo.dados;
            const rota = '/vendas/' + criada.id + '/excluir';
            const respostas = await Promise.all([requisitar('DELETE', rota, senha), requisitar('DELETE', rota, senha)]);
            assert.deepEqual(respostas.map(r => r.status).sort(), [200,404]);
            assert.equal((await buscar('SELECT estoque FROM PRODUTOS WHERE id = 1')).estoque, estoque);
            for (const tabela of ['PARCELAS','PAGAMENTOS','ITENS_VENDIDOS']) assert.equal((await buscar('SELECT COUNT(*) AS n FROM ' + tabela + ' WHERE venda_id = ?', [criada.id])).n, 0);
            const cancelada = (await requisitar('POST', '/vendas', {cliente_id: 1, itens: [{produto_id:1, quantidade:1}]})).corpo.dados;
            await requisitar('DELETE', '/vendas/' + cancelada.id);
            assert.equal((await requisitar('DELETE', '/vendas/' + cancelada.id + '/excluir', senha)).status, 200);
            assert.equal((await buscar('SELECT estoque FROM PRODUTOS WHERE id = 1')).estoque, estoque);
        });
        await t.test("exclusão de empresa é atômica e não remove dados de outras empresas", async () => {
            const senha = {senha_atual: 'senha de exclusao'};
            const criada = await requisitar('POST', '/vendas', {cliente_id:2, entrada:1, parcelamento:{quantidade:1, primeiro_vencimento:'2026-10-10'}, itens:[{produto_id:3, quantidade:2}]}, 2);
            assert.equal(criada.status, 201);
            const antes = await buscar('SELECT COUNT(*) AS n FROM VENDAS WHERE empresa_id = 1');
            await executar("CREATE TRIGGER impedir_exclusao BEFORE DELETE ON EMPRESAS WHEN OLD.id = 2 BEGIN SELECT RAISE(ABORT, 'falha simulada'); END");
            const log = console.error;
            try {
                console.error = () => {};
                assert.equal((await requisitar('DELETE', '/empresas/2/excluir', senha, 'superadmin')).status, 500);
            } finally { console.error = log; await executar('DROP TRIGGER impedir_exclusao'); }
            assert.ok(await buscar('SELECT id FROM VENDAS WHERE id = ?', [criada.corpo.dados.id]));
            assert.equal((await requisitar('DELETE', '/empresas/2/excluir', senha, 'superadmin')).status, 200);
            for (const tabela of ['PARCELAS','PAGAMENTOS','ITENS_VENDIDOS','VENDAS','USUARIOS','PRODUTOS','CLIENTES']) assert.equal((await buscar('SELECT COUNT(*) AS n FROM ' + tabela + ' WHERE empresa_id = 2')).n, 0);
            assert.equal(await buscar('SELECT id FROM EMPRESAS WHERE id = 2'), undefined);
            assert.deepEqual(await buscar('SELECT COUNT(*) AS n FROM VENDAS WHERE empresa_id = 1'), antes);
        });
        await t.test("migração converte status antigos e pode ser repetida", async () => {

            await executar("UPDATE VENDAS SET status = 'concluida' WHERE id = ?", [venda.id]);

            const migracaoStatus = await carregar(path.join(raiz, "src/database/migrarStatusVendas.ts"));

            await migracaoStatus.evaluate();

            await migracaoStatus.namespace.migrarStatusVendas();

            assert.equal((await buscar("SELECT status FROM VENDAS WHERE id = ?", [venda.id])).status, "pendente");

            await executar("UPDATE VENDAS SET status = 'cancelada' WHERE id = ?", [venda.id]);

            await migracaoStatus.namespace.migrarStatusVendas();

            await migracaoStatus.namespace.migrarStatusVendas();

            assert.equal((await buscar("SELECT status FROM VENDAS WHERE id = ?", [venda.id])).status, "cancelado");

        });

    } finally {

        if (servidor) {

            await new Promise((resolve) => servidor.close(resolve));

        }

        bancoLibsql?.close();

        for (const [nome, valor] of Object.entries(ambienteBanco)) {

            if (valor === undefined) delete process.env[nome];

            else process.env[nome] = valor;

        }

        await new Promise((resolve, reject) => db.close((erro) => erro ? reject(erro) : resolve()));

        assert.equal(path.dirname(path.resolve(pasta)), path.resolve(tmpdir()));

        assert.ok(path.basename(pasta).startsWith("loja-vendas-"));

        await rm(pasta, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });

        if (segredoAnterior === undefined) {

            delete process.env.JWT_SECRET;

        } else {

            process.env.JWT_SECRET = segredoAnterior;

        }

    }

});
