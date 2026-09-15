import type { AlterarVendaDTO, VendaDetalhadaDTO } from "../dtos/venda.dto.js";

import { executarSQL, executarTransacaoVenda } from "./transacaoVenda.repository.js";

import { buscarVendaNaConexao } from "./buscarVenda.repository.js";

import { validarParticipantesVendaRepository } from "./validarParticipantesVenda.repository.js";

import { criarItensVendidosRepository } from "../../itens_vendidos/repositories/criarItensVendidos.repository.js";

import { devolverEstoqueRepository } from "../../itens_vendidos/repositories/devolverEstoque.repository.js";

import { ErroVenda } from "../utils/erroVenda.util.js";

export function alterarVendaRepository(dados: AlterarVendaDTO, empresa_id: number, usuario_id: number, id: number): Promise<VendaDetalhadaDTO> {

    return executarTransacaoVenda(async (conexao) => {

        const venda = await buscarVendaNaConexao(conexao, empresa_id, id);

        if (venda.status !== "pendente") {

            throw new ErroVenda("Somente vendas pendentes podem ser alteradas.", 409);

        }

        const cliente_id = dados.cliente_id ?? venda.cliente_id;

        await validarParticipantesVendaRepository(conexao, empresa_id, usuario_id, cliente_id);

        let total = venda.valor_total;

        if (dados.itens !== undefined) {

            await devolverEstoqueRepository(conexao, empresa_id, id);

            await executarSQL(conexao, "DELETE FROM ITENS_VENDIDOS WHERE empresa_id = ? AND venda_id = ?", [empresa_id, id]);

            total = await criarItensVendidosRepository(conexao, dados.itens, empresa_id, id);

        }

        await executarSQL(conexao, "UPDATE VENDAS SET cliente_id = ?, valor_total = ? WHERE empresa_id = ? AND id = ?",
            [cliente_id, total, empresa_id, id]);

        return await buscarVendaNaConexao(conexao, empresa_id, id);

    });

}
