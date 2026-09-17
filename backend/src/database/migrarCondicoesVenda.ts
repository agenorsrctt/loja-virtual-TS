import { executarSQL, listarSQL, buscarSQL, executarTransacaoVenda } from "../modules/vendas/repositories/transacaoVenda.repository.js";
export async function migrarCondicoesVenda() {
    await executarTransacaoVenda(async c => {
        if (await buscarSQL(c, "SELECT nome FROM MIGRACOES WHERE nome = 'asr_schema_v3_vendas'")) return;
        const colunas = await listarSQL<{name: string}>(c, "PRAGMA table_info(VENDAS)");
        if (!colunas.some(x => x.name === 'comentarios')) await executarSQL(c, "ALTER TABLE VENDAS ADD COLUMN comentarios TEXT NOT NULL DEFAULT ''");
        const itens = await listarSQL<{name: string; notnull: number}>(c, "PRAGMA table_info(ITENS_VENDIDOS)");
        if (itens.some(x => x.name === 'produto_id' && x.notnull)) {
            await executarSQL(c, `CREATE TABLE ITENS_VENDIDOS_NOVOS(
                id INTEGER PRIMARY KEY AUTOINCREMENT, venda_id INTEGER NOT NULL, produto_id INTEGER,
                descricao TEXT, empresa_id INTEGER NOT NULL, valor_vendido REAL NOT NULL, quantidade INTEGER NOT NULL,
                FOREIGN KEY(produto_id) REFERENCES PRODUTOS(id), FOREIGN KEY(venda_id) REFERENCES VENDAS(id),
                FOREIGN KEY(empresa_id) REFERENCES EMPRESAS(id))`);
            await executarSQL(c, `INSERT INTO ITENS_VENDIDOS_NOVOS(id,venda_id,produto_id,empresa_id,valor_vendido,quantidade)
                SELECT id,venda_id,produto_id,empresa_id,valor_vendido,quantidade FROM ITENS_VENDIDOS`);
            await executarSQL(c, "DROP TABLE ITENS_VENDIDOS");
            await executarSQL(c, "ALTER TABLE ITENS_VENDIDOS_NOVOS RENAME TO ITENS_VENDIDOS");
        }
        await executarSQL(c, `INSERT INTO PAGAMENTOS(venda_id, empresa_id, valor, data)
            SELECT id, empresa_id, valor_total, data FROM VENDAS WHERE status = 'pago'
            AND NOT EXISTS(SELECT 1 FROM PAGAMENTOS p WHERE p.venda_id = VENDAS.id)`);
        await executarSQL(c, "INSERT INTO MIGRACOES(nome) VALUES('asr_schema_v3_vendas')");
    });
}
