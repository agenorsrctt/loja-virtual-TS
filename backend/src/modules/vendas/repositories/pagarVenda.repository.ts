import type { VendaDetalhadaDTO } from "../dtos/venda.dto.js";

import { executarSQL, executarTransacaoVenda } from "./transacaoVenda.repository.js";

import { buscarVendaNaConexao } from "./buscarVenda.repository.js";

import { ErroVenda } from "../utils/erroVenda.util.js";

export function pagarVendaRepository(empresa_id: number, id: number): Promise<VendaDetalhadaDTO> {

    return executarTransacaoVenda(async (conexao) => {

        const venda = await buscarVendaNaConexao(conexao, empresa_id, id);

        if (venda.status === "cancelado") {

            throw new ErroVenda("Venda cancelada não pode ser paga.", 409);

        }

        if (venda.status === "pago") {

            return venda;

        }

        await executarSQL(conexao, "UPDATE VENDAS SET status = 'pago' WHERE empresa_id = ? AND id = ?", [empresa_id, id]);

        return { ...venda, status: "pago" };

    });

}
