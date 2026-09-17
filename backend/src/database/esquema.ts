import db from "./connection.js";

import { executarSQL, buscarSQL } from "../modules/vendas/repositories/transacaoVenda.repository.js";

import { migrarAcesso } from "./migrarAcesso.js";

import { migrarCondicoesVenda } from "./migrarCondicoesVenda.js";
import { migrarStatusVendas } from "./migrarStatusVendas.js";

export async function prepararBanco(): Promise<void> {

    await executarSQL(db, `CREATE TABLE IF NOT EXISTS VISITAS(
        sessao TEXT PRIMARY KEY NOT NULL
        )`);

    await executarSQL(db, `CREATE TABLE IF NOT EXISTS EMPRESAS(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa TEXT NOT NULL,
        cnpj TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL
        )`);

    await executarSQL(db, `CREATE TABLE IF NOT EXISTS USUARIOS(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        email TEXT NOT NULL,
        status TEXT NOT NULL,
        senha TEXT NOT NULL,
        primeiro_acesso BOOLEAN NOT NULL DEFAULT FALSE,
        FOREIGN KEY (empresa_id) references EMPRESAS(id),
        UNIQUE (empresa_id, email)
        )`);

    await executarSQL(db, `CREATE TABLE IF NOT EXISTS CLIENTES(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        email TEXT,
        telefone TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (empresa_id) references EMPRESAS(id),
        UNIQUE (empresa_id, email),
        UNIQUE (empresa_id, telefone)
        )`);

    await executarSQL(db, `CREATE TABLE IF NOT EXISTS PRODUTOS(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa_id INTEGER NOT NULL,
        produto TEXT NOT NULL,
        estoque INTEGER NOT NULL,
        preco REAL NOT NULL,
        categoria TEXT,
        codigo TEXT,
        status TEXT NOT NULL,
        FOREIGN KEY (empresa_id) references EMPRESAS(id)
        )`);

    await executarSQL(db, `CREATE TABLE IF NOT EXISTS VENDAS(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        cliente_id INTEGER NOT NULL,
        data DATETIME DEFAULT CURRENT_TIMESTAMP,
        comentarios TEXT NOT NULL DEFAULT '',
        valor_total REAL NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (empresa_id) references EMPRESAS(id),
        FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id),
        FOREIGN KEY (cliente_id) REFERENCES CLIENTES(id)
        )`);

    await executarSQL(db, `CREATE TABLE IF NOT EXISTS ITENS_VENDIDOS(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venda_id INTEGER NOT NULL,
        produto_id INTEGER,
        descricao TEXT,
        empresa_id INTEGER NOT NULL,
        valor_vendido REAL NOT NULL,
        quantidade INTEGER NOT NULL,
        FOREIGN KEY (produto_id) REFERENCES PRODUTOS(id),
        FOREIGN KEY (venda_id) REFERENCES VENDAS(id),
        FOREIGN KEY (empresa_id) references EMPRESAS(id)
        )`);

    await executarSQL(db, `CREATE TABLE IF NOT EXISTS PAGAMENTOS(
        id INTEGER PRIMARY KEY AUTOINCREMENT, venda_id INTEGER NOT NULL,
        empresa_id INTEGER NOT NULL, valor REAL NOT NULL, data TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(venda_id) REFERENCES VENDAS(id))`);
    await executarSQL(db, `CREATE TABLE IF NOT EXISTS PARCELAS(
        id INTEGER PRIMARY KEY AUTOINCREMENT, venda_id INTEGER NOT NULL,
        empresa_id INTEGER NOT NULL, numero INTEGER NOT NULL, valor REAL NOT NULL, vencimento TEXT NOT NULL,
        FOREIGN KEY(venda_id) REFERENCES VENDAS(id))`);
    await migrarAcesso();

    await migrarStatusVendas();
    await migrarCondicoesVenda();

    await executarSQL(db, "INSERT OR IGNORE INTO MIGRACOES(nome) VALUES('asr_schema_v1')");
    await executarSQL(db, "INSERT OR IGNORE INTO MIGRACOES(nome) VALUES('asr_schema_v2_visitas')");

}

export async function verificarBanco(): Promise<void> {

    const versao = await buscarSQL(db, "SELECT nome FROM MIGRACOES WHERE nome = 'asr_schema_v3_vendas'");

    if (!versao) {

        throw new Error("Banco desatualizado. Execute a preparação do Turso antes de publicar.");

    }

}
