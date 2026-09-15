import { executarTransacaoVenda, executarSQL, buscarSQL, listarSQL } from "../modules/vendas/repositories/transacaoVenda.repository.js";

import { gerarHashSenha } from "../modules/middleware/senha.util.js";

export async function migrarAcesso(): Promise<void> {

    await executarTransacaoVenda(async (conexao) => {

        await executarSQL(conexao, "CREATE TABLE IF NOT EXISTS SUPER_ADMIN (id INTEGER PRIMARY KEY CHECK(id = 1), email TEXT NOT NULL UNIQUE, senha TEXT NOT NULL, versao_token INTEGER NOT NULL DEFAULT 0)");

        await executarSQL(conexao, "CREATE TABLE IF NOT EXISTS MIGRACOES (nome TEXT PRIMARY KEY)");

        const colunas = await listarSQL<{ name: string }>(conexao, "PRAGMA table_info(USUARIOS)");

        if (!colunas.some((coluna) => coluna.name === "versao_token")) {

            await executarSQL(conexao, "ALTER TABLE USUARIOS ADD COLUMN versao_token INTEGER NOT NULL DEFAULT 0");

        }

        if (!colunas.some((coluna) => coluna.name === "primeiro_acesso")) {

            await executarSQL(conexao, "ALTER TABLE USUARIOS ADD COLUMN primeiro_acesso BOOLEAN NOT NULL DEFAULT FALSE");

        }

        const aplicada = await buscarSQL(conexao, "SELECT nome FROM MIGRACOES WHERE nome = 'primeiro_admin_v1'");

        if (!aplicada) {

            const hash = await gerarHashSenha("123456");

            await executarSQL(conexao, "UPDATE USUARIOS SET senha = CASE WHEN senha = '123456' THEN ? ELSE senha END, primeiro_acesso = 1, versao_token = versao_token + 1 WHERE tipo = 'admin' AND lower(email) = 'mudar@email.com'", [hash]);

            await executarSQL(conexao, "INSERT INTO MIGRACOES(nome) VALUES('primeiro_admin_v1')");

        }

    });

}
