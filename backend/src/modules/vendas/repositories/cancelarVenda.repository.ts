import type { VendaDetalhadaDTO } from "../dtos/venda.dto.js";

import { executarSQL, executarTransacaoVenda } from "./transacaoVenda.repository.js";

import { buscarVendaNaConexao } from "./buscarVenda.repository.js";

import { devolverEstoqueRepository } from "../../itens_vendidos/repositories/devolverEstoque.repository.js";

export function cancelarVendaRepository(empresa_id: number, id: number): Promise<VendaDetalhadaDTO> {

    return executarTransacaoVenda(async (conexao) => {

        const venda = await buscarVendaNaConexao(conexao, empresa_id, id);

        if (venda.status === "cancelado") {

            return venda;

        }

        await devolverEstoqueRepository(conexao, empresa_id, id);

        await executarSQL(conexao, "UPDATE VENDAS SET status = 'cancelado' WHERE empresa_id = ? AND id = ?", [empresa_id, id]);

        return { ...venda, status: "cancelado" };

    });

}
