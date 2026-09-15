import type sqlite3 from "sqlite3";

import type { ItemVendidoDTO } from "../dtos/itemVendido.dto.js";

import { buscarSQL, executarSQL, listarSQL } from "../../vendas/repositories/transacaoVenda.repository.js";

import { ErroVenda } from "../../vendas/utils/erroVenda.util.js";

export async function devolverEstoqueRepository(conexao: sqlite3.Database, empresa_id: number, venda_id: number): Promise<void> {

    const itens = await listarSQL<ItemVendidoDTO>(conexao,
        "SELECT * FROM ITENS_VENDIDOS WHERE empresa_id = ? AND venda_id = ?", [empresa_id, venda_id]);

    for (const item of itens) {

        const produto = await buscarSQL<{ estoque: number }>(conexao,
            "SELECT estoque FROM PRODUTOS WHERE empresa_id = ? AND id = ?", [empresa_id, item.produto_id]);

        if (!produto || !Number.isSafeInteger(item.quantidade) || item.quantidade <= 0 || !Number.isSafeInteger(produto.estoque) || produto.estoque < 0 || !Number.isSafeInteger(produto.estoque + item.quantidade)) {

            throw new ErroVenda("Não foi possível devolver o estoque do produto.", 409);

        }

        await executarSQL(conexao, "UPDATE PRODUTOS SET estoque = estoque + ? WHERE empresa_id = ? AND id = ?",
            [item.quantidade, empresa_id, item.produto_id]);

    }

}
