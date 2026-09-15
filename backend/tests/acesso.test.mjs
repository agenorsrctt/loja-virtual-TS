import assert from "node:assert/strict";

import { test } from "node:test";

import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";

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

test("superAdmin e primeiro acesso: fluxo HTTP completo", async (t) => {

    const pasta = await mkdtemp(path.join(tmpdir(), "loja-acesso-"));

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

        assert.equal(tabelas.length, 7);

        for (const [, sql] of tabelas) {

            await executar(sql);

        }

        await executar("INSERT INTO EMPRESAS(id, empresa, cnpj, status) VALUES(1, 'Loja A', '1', 'ativo'), (2, 'Loja B', '2', 'ativo')");

        await executar("INSERT INTO USUARIOS(id, empresa_id, nome, tipo, email, status, senha) VALUES(1, 1, 'A', 'admin', 'a@teste.com', 'ativo', 'teste'), (2, 2, 'B', 'admin', 'b@teste.com', 'ativo', 'teste')");

        await executar("INSERT INTO CLIENTES(id, empresa_id, nome, telefone, status) VALUES(1, 1, 'A', '111', 'ativo'), (2, 2, 'B', '222', 'ativo'), (3, 1, 'C', '333', 'inativo')");

        await executar("INSERT INTO PRODUTOS(id, empresa_id, produto, estoque, preco, status) VALUES(1, 1, 'P1', 10, 10.15, 'ativo'), (2, 1, 'P2', 5, 0.10, 'ativo'), (3, 2, 'P3', 10, 1, 'ativo'), (4, 1, 'P4', 1, 20, 'ativo'), (5, 1, 'P5', 10, 1, 'inativo')");

        const hash = await require("bcrypt").hash("senha inicial de teste", 10);

        await executar("UPDATE USUARIOS SET senha = ?", [hash]);

        await executar("INSERT INTO USUARIOS(id, empresa_id, nome, tipo, email, status, senha) VALUES(3, 1, 'Antigo', 'admin', 'mudar@email.com', 'ativo', '123456')");

        const migracao = await carregar(path.join(raiz, "src/database/migrarAcesso.ts"));

        await migracao.evaluate();

        await migracao.namespace.migrarAcesso();

        const app = express();

        app.use(express.json());

        const visitas = await carregar(path.join(raiz, "src/modules/acesso/controllers/visitas.controller.ts"));
        await visitas.evaluate();
        app.post('/visitas', visitas.namespace.registrarVisita);

        for (const [rota, arquivo] of [["/administracao", "acesso/routes/administracao.routes.ts"], ["/empresas", "empresas/routes/empresas.routes.ts"], ["/usuarios", "usuarios/routes/usuarios.routes.ts"], ["/clientes", "clientes/routes/clientes.routes.ts"], ["/vendas", "vendas/routes/vendas.routes.ts"]]) {

            const modulo = await carregar(path.join(raiz, "src/modules", arquivo));

            await modulo.evaluate();

            app.use(rota, modulo.namespace.default);

        }

        servidor = await new Promise((resolve) => {

            const instancia = app.listen(0, "127.0.0.1", () => resolve(instancia));

        });

        const base = `http://127.0.0.1:${servidor.address().port}`;

        async function requisitar(metodo, rota, dados, token) {

            const headers = { "Content-Type": "application/json" };

            if (token) {

                headers.Authorization = "Bearer " + token;

            }

            const resposta = await fetch(base + rota, { method: metodo, headers, ...(dados === undefined ? {} : { body: JSON.stringify(dados) }) });

            return { status: resposta.status, corpo: resposta.status === 204 ? null : await resposta.json() };

        }

        const servicos = await carregar(path.join(raiz, "src/modules/acesso/services/acesso.service.ts"));

        await servicos.evaluate();

        let tokenSuper;

        let temporario;

        let empresa;

        let tokenAdmin;

        await t.test("comando inicial cria superAdmin uma vez em banco vazio", async () => {

            await mkdir(path.join(pasta, "src/database"), { recursive: true });

            const comando = () => new Promise((resolve) => {

                require("node:child_process").execFile(process.execPath,
                    [path.join(raiz, "node_modules/tsx/dist/cli.mjs"), path.join(raiz, "scripts/criarSuperAdmin.ts")],
                    { cwd: pasta, env: { ...process.env, TURSO_DATABASE_URL: "", TURSO_AUTH_TOKEN: "", VERCEL: "", SQLITE_PATH: path.join(pasta, "src/database/database.db"), SUPERADMIN_EMAIL: "cli@teste.com", SUPERADMIN_SENHA: "senha exclusiva do teste cli" } },
                    (erro, stdout, stderr) => resolve({ erro, stdout, stderr }));

            });

            const primeira = await comando();

            assert.equal(primeira.erro, null, primeira.stderr);

            assert.match(primeira.stdout, /SuperAdmin criado/);

            const segunda = await comando();

            assert.equal(segunda.erro?.code, 1);

            assert.match(segunda.stderr, /superAdmin já foi criado/);

            assert.ok(!primeira.stdout.includes("senha exclusiva do teste cli"));

        });

        await t.test("migração marca admin legado e é idempotente", async () => {

            const legado = await buscar("SELECT * FROM USUARIOS WHERE id = 3");

            assert.equal(legado.primeiro_acesso, 1);

            assert.equal(legado.versao_token, 1);

            assert.ok(await require("bcrypt").compare("123456", legado.senha));

            await migracao.namespace.migrarAcesso();

            assert.equal((await buscar("SELECT versao_token FROM USUARIOS WHERE id = 3")).versao_token, 1);

            const login = await requisitar("POST", "/usuarios/login", { empresa_id: 1, email: "mudar@email.com", senha: "123456" });

            assert.equal(login.status, 200);

            assert.equal(login.corpo.primeiro_acesso, true);

        });

        await t.test("superAdmin único protegido no serviço e no banco", async () => {

            const resultados = await Promise.allSettled([
                servicos.namespace.criarSuperAdminService("dono@teste.com", "senha inicial do dono"),
                servicos.namespace.criarSuperAdminService("dono@teste.com", "senha inicial do dono")
            ]);

            assert.equal(resultados.filter((resultado) => resultado.status === "fulfilled").length, 1);

            assert.equal((await buscar("SELECT COUNT(*) AS total FROM SUPER_ADMIN")).total, 1);

            await assert.rejects(executar("INSERT INTO SUPER_ADMIN(id, email, senha) VALUES(2, 'segundo@teste.com', 'x')"));

            await assert.rejects(servicos.namespace.criarSuperAdminService("outro@teste.com", "outra senha de teste"));

            assert.equal((await requisitar("POST", "/administracao/login", { email: "dono@teste.com", senha: "errada" })).status, 401);

            const login = await requisitar("POST", "/administracao/login", { email: "dono@teste.com", senha: "senha inicial do dono" });

            assert.equal(login.status, 200);

            tokenSuper = login.corpo.token;

        });

        await t.test("somente superAdmin administra empresas, sem acesso empresarial", async () => {

            assert.equal((await requisitar("POST", "/empresas", { empresa: "Teste", cnpj: "100" })).status, 401);

            const normal = await requisitar("POST", "/usuarios/login", { empresa_id: 1, email: "a@teste.com", senha: "senha inicial de teste" });

            assert.equal(normal.status, 200);

            assert.equal((await requisitar("GET", "/empresas", undefined, normal.corpo.token)).status, 403);

            assert.equal((await requisitar("POST", "/empresas", { empresa: "Teste", cnpj: "100" }, normal.corpo.token)).status, 403);

            assert.equal((await requisitar("GET", "/clientes", undefined, tokenSuper)).status, 403);

            const criada = await requisitar("POST", "/empresas", { empresa: "Nova", cnpj: "100" }, tokenSuper);

            assert.equal(criada.status, 201);

            empresa = criada.corpo.dados;

            assert.equal(empresa.administrador.primeiro_acesso, true);

            const usuario = await buscar("SELECT * FROM USUARIOS WHERE id = ?", [empresa.administrador.id]);

            assert.equal(empresa.administrador.email, "primeiro@acesso.com");

            assert.equal(empresa.administrador.senha_temporaria, "123456");

            assert.notEqual(usuario.senha, empresa.administrador.senha_temporaria);

            assert.ok(await require("bcrypt").compare(empresa.administrador.senha_temporaria, usuario.senha));

            const duplicada = await requisitar("POST", "/empresas", { empresa: "Nova", cnpj: "100" }, tokenSuper);

            assert.equal(duplicada.status, 409);

            assert.equal((await buscar("SELECT COUNT(*) AS total FROM USUARIOS WHERE empresa_id = ?", [empresa.id])).total, 1);

        });

        await t.test("token temporário só acessa troca e não cruza empresas", async () => {

            const dados = { empresa_id: empresa.id, email: empresa.administrador.email, senha: empresa.administrador.senha_temporaria };

            assert.equal((await requisitar("POST", "/usuarios/login", { ...dados, empresa_id: 1 })).status, 401);

            const login = await requisitar("POST", "/usuarios/login", dados);

            assert.equal(login.status, 200);

            assert.equal(login.corpo.primeiro_acesso, true);

            temporario = login.corpo.token;

            const claims = jwt.decode(temporario);

            assert.equal(claims.exp - claims.iat, 900);

            for (const rota of ["/clientes", "/usuarios", "/vendas", "/empresas"]) {

                assert.equal((await requisitar("GET", rota, undefined, temporario)).status, 403);

            }

            for (const body of [ {}, { novo_email: empresa.administrador.email, nova_senha: "senha definitiva forte" }, { novo_email: "novo@teste.com", nova_senha: empresa.administrador.senha_temporaria }, { novo_email: "invalido", nova_senha: "senha definitiva forte" }, { novo_email: "novo@teste.com", nova_senha: "curta" } ]) {

                assert.equal((await requisitar("PATCH", "/usuarios/primeiro-acesso", body, temporario)).status, 400);

            }

            await executar("INSERT INTO USUARIOS(empresa_id, nome, tipo, email, status, senha) VALUES(?, 'Conflito', 'colaborador', 'ocupado@teste.com', 'ativo', 'hash')", [empresa.id]);

            assert.equal((await requisitar("PATCH", "/usuarios/primeiro-acesso", { novo_email: "ocupado@teste.com", nova_senha: "senha definitiva forte" }, temporario)).status, 409);

            assert.equal((await buscar("SELECT primeiro_acesso FROM USUARIOS WHERE id = ?", [empresa.administrador.id])).primeiro_acesso, 1);

        });

        await t.test("troca obrigatória é atômica e revoga o token temporário", async () => {

            const body = { novo_email: "novo@teste.com", nova_senha: "senha definitiva forte", empresa_id: 1, id: 1 };

            const resultados = await Promise.all([
                requisitar("PATCH", "/usuarios/primeiro-acesso", body, temporario),
                requisitar("PATCH", "/usuarios/primeiro-acesso", body, temporario)
            ]);

            assert.deepEqual(resultados.map((r) => r.status).sort(), [200, 401]);

            assert.equal((await requisitar("PATCH", "/usuarios/primeiro-acesso", body, temporario)).status, 401);

            assert.equal((await requisitar("GET", "/clientes", undefined, temporario)).status, 401);

            assert.equal((await requisitar("POST", "/usuarios/login", { empresa_id: empresa.id, email: empresa.administrador.email, senha: empresa.administrador.senha_temporaria })).status, 401);

            const login = await requisitar("POST", "/usuarios/login", { empresa_id: empresa.id, email: "novo@teste.com", senha: "senha definitiva forte" });

            assert.equal(login.status, 200);

            assert.equal(login.corpo.primeiro_acesso, false);

            tokenAdmin = login.corpo.token;

            assert.deepEqual((await requisitar("GET", "/clientes", undefined, tokenAdmin)).corpo.dados, []);

            assert.equal((await requisitar("PATCH", "/usuarios/primeiro-acesso", body, tokenAdmin)).status, 403);

            assert.equal((await buscar("SELECT email FROM USUARIOS WHERE id = 1")).email, "a@teste.com");

        });

        await t.test("visitas são persistidas sem duplicação e consultadas somente pelo superadmin", async () => {
            assert.equal((await requisitar('GET', '/administracao/visitas')).status, 401);
            assert.equal((await requisitar('GET', '/administracao/visitas', undefined, tokenAdmin)).status, 403);
            assert.equal((await requisitar('POST', '/visitas', {})).status, 400);
            assert.equal((await requisitar('POST', '/visitas', { sessao: 'invalida' })).status, 400);
            const sessao = 'd568664a-82f8-48b4-9a37-442aaf5eedca';
            const respostas = await Promise.all(Array.from({ length: 5 }, () => requisitar('POST', '/visitas', { sessao })));
            assert.ok(respostas.every(r => r.status === 204));
            assert.equal((await requisitar('POST', '/visitas', { sessao: sessao.toUpperCase() })).status, 204);
            assert.equal((await requisitar('GET', '/administracao/visitas', undefined, tokenSuper)).corpo.dados.total, 1);
            await requisitar('POST', '/visitas', { sessao: 'd568664a-82f8-48b4-9a37-442aaf5eedcb' });
            assert.equal((await requisitar('GET', '/administracao/visitas', undefined, tokenSuper)).corpo.dados.total, 2);
            assert.equal((await buscar('SELECT COUNT(*) AS total FROM VISITAS')).total, 2);
        });

        await t.test("senha do superAdmin exige senha atual e revoga todas as sessões", async () => {

            const segundo = (await requisitar("POST", "/administracao/login", { email: "dono@teste.com", senha: "senha inicial do dono" })).corpo.token;

            assert.equal((await requisitar("PATCH", "/administracao/senha", { senha_atual: "errada", nova_senha: "senha nova do dono" }, tokenSuper)).status, 401);

            assert.equal((await requisitar("PATCH", "/administracao/senha", { senha_atual: "senha inicial do dono", nova_senha: "senha inicial do dono" }, tokenSuper)).status, 400);

            assert.equal((await requisitar("PATCH", "/administracao/senha", { senha_atual: "senha inicial do dono", nova_senha: "senha nova do dono" }, tokenAdmin)).status, 403);

            assert.equal((await requisitar("PATCH", "/administracao/senha", { senha_atual: "senha inicial do dono", nova_senha: "senha nova do dono" }, tokenSuper)).status, 200);

            for (const token of [tokenSuper, segundo]) {

                assert.equal((await requisitar("GET", "/empresas", undefined, token)).status, 401);

            }

            assert.equal((await requisitar("POST", "/administracao/login", { email: "dono@teste.com", senha: "senha inicial do dono" })).status, 401);

            assert.equal((await requisitar("POST", "/administracao/login", { email: "dono@teste.com", senha: "senha nova do dono" })).status, 200);

        });

        await t.test("perfil não expõe senhas e usuário troca sua própria senha", async () => {

            const perfil = await requisitar("GET", "/usuarios/perfil", undefined, tokenAdmin);

            assert.equal(perfil.status, 200);

            assert.equal(perfil.corpo.dados.email, "novo@teste.com");

            assert.equal(perfil.corpo.dados.senha, undefined);

            assert.equal(perfil.corpo.dados.empresa_nome, "Nova");

            const errado = await requisitar("PATCH", "/usuarios/senha", { senha_atual: "errada", nova_senha: "senha nova do perfil" }, tokenAdmin);

            assert.equal(errado.status, 401);

            assert.equal((await requisitar("GET", "/usuarios/perfil", undefined, tokenAdmin)).status, 200);

            const troca = await requisitar("PATCH", "/usuarios/senha", { senha_atual: "senha definitiva forte", nova_senha: "senha nova do perfil", id: 1, empresa_id: 1 }, tokenAdmin);

            assert.equal(troca.status, 200);

            assert.equal((await requisitar("GET", "/usuarios/perfil", undefined, tokenAdmin)).status, 401);

            const login = await requisitar("POST", "/usuarios/login", { empresa_id: empresa.id, email: "novo@teste.com", senha: "senha nova do perfil" });

            assert.equal(login.status, 200);

            tokenAdmin = login.corpo.token;

        });

        await t.test("desativação bloqueia login e tokens já emitidos", async () => {

            await executar("UPDATE EMPRESAS SET status = 'inativo' WHERE id = ?", [empresa.id]);

            assert.equal((await requisitar("GET", "/clientes", undefined, tokenAdmin)).status, 401);

            assert.equal((await requisitar("POST", "/usuarios/login", { empresa_id: empresa.id, email: "novo@teste.com", senha: "senha nova do perfil" })).status, 401);

            await executar("UPDATE EMPRESAS SET status = 'ativo' WHERE id = ?", [empresa.id]);

            await executar("UPDATE USUARIOS SET status = 'inativo' WHERE id = ?", [empresa.administrador.id]);

            assert.equal((await requisitar("GET", "/clientes", undefined, tokenAdmin)).status, 401);

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

        assert.ok(path.basename(pasta).startsWith("loja-acesso-"));

        await rm(pasta, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });

        if (segredoAnterior === undefined) {

            delete process.env.JWT_SECRET;

        } else {

            process.env.JWT_SECRET = segredoAnterior;

        }

    }

});
