import assert from "node:assert/strict";

import { test } from "node:test";

import { mkdtemp, readFile, rm } from "node:fs/promises";

import { readFileSync } from "node:fs";

import { tmpdir } from "node:os";

import path from "node:path";

import { fileURLToPath } from "node:url";

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

    const moduloBanco = sintetico(db);

    const moduloSqlite = sintetico({ ...sqlite3, Database: BancoTeste });

    const modulos = new Map();

    const pacotes = new Map();

    async function carregar(arquivo) {

        if (modulos.has(arquivo)) {

            return modulos.get(arquivo);

        }

        const carregamento = Promise.resolve().then(async () => {

            const codigo = stripTypeScriptTypes(readFileSync(arquivo, "utf8"), { mode: "transform" });

            const modulo = new SourceTextModule(codigo, { identifier: arquivo });

            await modulo.link(async (referencia, origem) => {

                if (referencia.endsWith("/database/connection.js")) {

                    return moduloBanco;

                }

                if (referencia === "sqlite3") {

                    return moduloSqlite;

                }

                if (!referencia.startsWith(".")) {

                    if (!pacotes.has(referencia)) {

                        pacotes.set(referencia, sintetico(require(referencia)));

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

    let servidor;

    try {

        await executar("PRAGMA foreign_keys = ON");

        const init = await readFile(path.join(raiz, "src/database/init.ts"), "utf8");

        const tabelas = [...init.matchAll(/db\.run\(`(CREATE TABLE[\s\S]*?)`\)/g)];

        assert.equal(tabelas.length, 6);

        for (const [, sql] of tabelas) {

            await executar(sql);

        }

        await executar("INSERT INTO EMPRESAS(id, empresa, cnpj, status) VALUES(1, 'Loja A', '1', 'ativo'), (2, 'Loja B', '2', 'ativo')");

        await executar("INSERT INTO USUARIOS(id, empresa_id, nome, tipo, email, status, senha) VALUES(1, 1, 'A', 'admin', 'a@teste.com', 'ativo', 'teste'), (2, 2, 'B', 'admin', 'b@teste.com', 'ativo', 'teste')");

        await executar("INSERT INTO CLIENTES(id, empresa_id, nome, telefone, status) VALUES(1, 1, 'A', '111', 'ativo'), (2, 2, 'B', '222', 'ativo'), (3, 1, 'C', '333', 'inativo')");

        await executar("INSERT INTO PRODUTOS(id, empresa_id, produto, estoque, preco, status) VALUES(1, 1, 'P1', 10, 10.15, 'ativo'), (2, 1, 'P2', 5, 0.10, 'ativo'), (3, 2, 'P3', 10, 1, 'ativo'), (4, 1, 'P4', 1, 20, 'ativo'), (5, 1, 'P5', 10, 1, 'inativo')");

        const migracao = await carregar(path.join(raiz, "src/database/migrarAcesso.ts"));

        await migracao.evaluate();

        await migracao.namespace.migrarAcesso();

        const app = express();

        app.use(express.json());

        for (const [rota, arquivo] of [["/vendas", "vendas/routes/vendas.routes.ts"], ["/itens-vendidos", "itens_vendidos/routes/itensVendidos.routes.ts"], ["/produtos", "produtos/routes/produtos.routes.ts"]]) {

            const modulo = await carregar(path.join(raiz, "src/modules", arquivo));

            await modulo.evaluate();

            app.use(rota, modulo.namespace.default);

        }

        servidor = await new Promise((resolve) => {

            const instancia = app.listen(0, "127.0.0.1", () => resolve(instancia));

        });

        const base = `http://127.0.0.1:${servidor.address().port}`;

        async function requisitar(metodo, rota, dados, empresa = 1) {

            const headers = { "Content-Type": "application/json" };

            if (empresa) {

                headers.Authorization = "Bearer " + jwt.sign({ id: empresa, empresa_id: empresa, email: "teste@teste.com", tipo: "admin", escopo: "empresa", finalidade: "acesso", versao_token: 0 }, process.env.JWT_SECRET, { expiresIn: "1h" });

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

            const resposta = await requisitar("POST", "/vendas", { ...dadosVenda, empresa_id: 2, usuario_id: 2, valor_total: 1, status: "cancelada" });

            assert.equal(resposta.status, 201);

            venda = resposta.corpo.dados;

            assert.equal(venda.empresa_id, 1);

            assert.equal(venda.usuario_id, 1);

            assert.equal(venda.status, "concluida");

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

            assert.equal((await requisitar("GET", `/vendas/${venda.id}`)).corpo.dados.status, "cancelada");

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

    } finally {

        if (servidor) {

            await new Promise((resolve) => servidor.close(resolve));

        }

        await new Promise((resolve, reject) => db.close((erro) => erro ? reject(erro) : resolve()));

        assert.equal(path.dirname(path.resolve(pasta)), path.resolve(tmpdir()));

        assert.ok(path.basename(pasta).startsWith("loja-vendas-"));

        await rm(pasta, { recursive: true, force: true });

        if (segredoAnterior === undefined) {

            delete process.env.JWT_SECRET;

        } else {

            process.env.JWT_SECRET = segredoAnterior;

        }

    }

});
