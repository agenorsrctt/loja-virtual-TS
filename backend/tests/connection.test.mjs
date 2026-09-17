import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const cwd = fileURLToPath(new URL('../', import.meta.url));

function executar(codigo, variaveis = {}) {
    const env = { ...process.env };
    for (const nome of ['VERCEL', 'TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'SQLITE_PATH', 'NODE_OPTIONS']) {
        delete env[nome];
    }
    const resultado = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', codigo], {
        cwd,
        env: { ...env, ...variaveis },
        encoding: 'utf8',
        timeout: 15000,
    });
    assert.ifError(resultado.error);
    assert.equal(resultado.status, 0, resultado.stdout + resultado.stderr);
}

const bloquearSqlite = `
    import { registerHooks } from 'node:module';
    registerHooks({ resolve(specifier, context, nextResolve) {
        if (specifier === 'sqlite3') throw new Error('SQLite não deve ser carregado no modo Turso');
        return nextResolve(specifier, context);
    }});
`;

test('Turso inicia mesmo com o carregamento de sqlite3 bloqueado', () => {
    executar(bloquearSqlite + `
        import assert from 'node:assert/strict';
        const { default: db } = await import('./src/database/connection.ts');
        assert.equal(db.constructor.name, 'BancoTurso');
        await new Promise((resolve, reject) => db.close(erro => erro ? reject(erro) : resolve()));
    `, { VERCEL: '1', TURSO_DATABASE_URL: 'libsql://teste.invalid', TURSO_AUTH_TOKEN: 'token-de-teste' });
});

test('Vercel sem Turso falha com mensagem de configuração antes de carregar SQLite', () => {
    executar(bloquearSqlite + `
        import assert from 'node:assert/strict';
        await assert.rejects(import('./src/database/connection.ts'), /Configure o Turso antes de publicar/);
    `, { VERCEL: '1' });
});

test('aplicativo completo inicia no modo Vercel sem carregar SQLite', () => {
    executar(bloquearSqlite + `
        import assert from 'node:assert/strict';
        const { clienteTurso } = await import('./src/database/turso.ts');
        const cliente = clienteTurso();
        // Simula somente a consulta de versão, sem acessar um banco remoto.
        cliente.execute = async ({ sql }) => {
            assert.equal(sql, "SELECT nome FROM MIGRACOES WHERE nome = 'asr_schema_v3_vendas'");
            return { rows: [{ nome: 'asr_schema_v3_vendas' }] };
        };
        try {
            const { default: app } = await import('./src/app.ts');
            const { bancoPronto } = await import('./src/database/init.ts');
            await bancoPronto;
            assert.equal(typeof app.listen, 'function');
        } finally {
            cliente.close();
        }
    `, { VERCEL: '1', TURSO_DATABASE_URL: 'libsql://teste.invalid', TURSO_AUTH_TOKEN: 'token-de-teste' });
});

test('modo local abre SQLite com integridade referencial ativada', () => {
    executar(`
        import assert from 'node:assert/strict';
        const { default: db } = await import('./src/database/connection.ts');
        try {
            const linha = await new Promise((resolve, reject) => db.get('PRAGMA foreign_keys', [],
                (erro, linha) => erro ? reject(erro) : resolve(linha)));
            assert.equal(linha.foreign_keys, 1);
        } finally {
            await new Promise((resolve, reject) => db.close(erro => erro ? reject(erro) : resolve()));
        }
    `, { SQLITE_PATH: ':memory:' });
});


test('API se recupera após migração e compartilha tentativas com intervalo mínimo', () => {
    executar(bloquearSqlite + `
        import assert from 'node:assert/strict';
        const { clienteTurso } = await import('./src/database/turso.ts');
        const cliente = clienteTurso();
        let consultas = 0;
        let atualizado = false;
        let agora = 10000;
        const relogio = Date.now;
        Date.now = () => agora;
        cliente.execute = async () => {
            consultas++;
            return { rows: atualizado ? [{nome:'asr_schema_v3_vendas'}] : [] };
        };
        try {
            const { bancoPronto, garantirBancoPronto } = await import('./src/database/init.ts');
            await assert.rejects(bancoPronto);
            await assert.rejects(garantirBancoPronto());
            assert.equal(consultas, 1);
            agora += 5000;
            const falha = garantirBancoPronto();
            assert.equal(garantirBancoPronto(), falha);
            await assert.rejects(falha);
            assert.equal(consultas, 2);
            atualizado = true;
            agora += 5000;
            const recuperacao = garantirBancoPronto();
            assert.equal(garantirBancoPronto(), recuperacao);
            await recuperacao;
            assert.equal(consultas, 3);
            agora += 60000;
            await garantirBancoPronto();
            assert.equal(consultas, 3);
        } finally { Date.now = relogio; cliente.close(); }
    `, { VERCEL: '1', TURSO_DATABASE_URL: 'libsql://teste.invalid', TURSO_AUTH_TOKEN: 'token-de-teste' });
});
