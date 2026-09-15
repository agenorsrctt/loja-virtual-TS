import type { CriarVendaDTO, VendaDetalhadaDTO } from "../dtos/venda.dto.js";

import { executarSQL, executarTransacaoVenda } from "./transacaoVenda.repository.js";

import { validarParticipantesVendaRepository } from "./validarParticipantesVenda.repository.js";

import { criarItensVendidosRepository } from "../../itens_vendidos/repositories/criarItensVendidos.repository.js";

import { buscarVendaNaConexao } from "./buscarVenda.repository.js";

export function criarVendaRepository(dados: CriarVendaDTO, empresa_id: number, usuario_id: number): Promise<VendaDetalhadaDTO> {

    return executarTransacaoVenda(async (conexao) => {

        await validarParticipantesVendaRepository(conexao, empresa_id, usuario_id, dados.cliente_id);

        const venda = await executarSQL(conexao,
            "INSERT INTO VENDAS(empresa_id, usuario_id, cliente_id, valor_total, status) VALUES(?, ?, ?, 0, 'pendente')",
            [empresa_id, usuario_id, dados.cliente_id]);

        const total = await criarItensVendidosRepository(conexao, dados.itens, empresa_id, venda.id);

        await executarSQL(conexao, "UPDATE VENDAS SET valor_total = ? WHERE empresa_id = ? AND id = ?", [total, empresa_id, venda.id]);

        return await buscarVendaNaConexao(conexao, empresa_id, venda.id);

    });

}
