import type { ConexaoBanco } from "../../../database/conexaoBanco.js";

import type { CriarItemVendidoDTO } from "../dtos/itemVendido.dto.js";

import { buscarSQL, executarSQL } from "../../vendas/repositories/transacaoVenda.repository.js";

import { ErroVenda } from "../../vendas/utils/erroVenda.util.js";

export async function criarItensVendidosRepository(conexao: ConexaoBanco, itens: CriarItemVendidoDTO[], empresa_id: number, venda_id: number): Promise<number> {

    let totalCentavos = 0;

    for (const item of itens) {

        const produto = await buscarSQL<{ preco: number; estoque: number; status: string }>(conexao,
            "SELECT preco, estoque, status FROM PRODUTOS WHERE empresa_id = ? AND id = ?", [empresa_id, item.produto_id]);

        if (!produto) {

            throw new ErroVenda("Produto não encontrado.", 404);

        }

        if (produto.status !== "ativo") {

            throw new ErroVenda("Produto inativo.", 409);

        }

        const precoCentavos = Math.round(produto.preco * 100);

        const subtotal = precoCentavos * item.quantidade;

        if (!Number.isSafeInteger(precoCentavos) || precoCentavos <= 0 || !Number.isSafeInteger(subtotal) || !Number.isSafeInteger(totalCentavos + subtotal)) {

            throw new ErroVenda("Preço ou total da venda inválido.", 400);

        }

        if (!Number.isSafeInteger(produto.estoque) || produto.estoque < item.quantidade) {

            throw new ErroVenda("Estoque insuficiente.", 409);

        }

        const resultado = await executarSQL(conexao,
            "UPDATE PRODUTOS SET estoque = estoque - ? WHERE empresa_id = ? AND id = ? AND estoque >= ? AND status = 'ativo'",
            [item.quantidade, empresa_id, item.produto_id, item.quantidade]);

        if (resultado.alteracoes !== 1) {

            throw new ErroVenda("Estoque insuficiente.", 409);

        }

        await executarSQL(conexao,
            "INSERT INTO ITENS_VENDIDOS(venda_id, produto_id, empresa_id, valor_vendido, quantidade) VALUES(?, ?, ?, ?, ?)",
            [venda_id, item.produto_id, empresa_id, precoCentavos / 100, item.quantidade]);

        totalCentavos += subtotal;

    }

    return totalCentavos / 100;

}
