import { ErroVenda } from "../utils/erroVenda.util.js";
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

        await executarSQL(conexao, "UPDATE VENDAS SET comentarios = ? WHERE id = ? AND empresa_id = ?", [dados.comentarios?.trim() ?? '', venda.id, empresa_id]);
        const entrada = Math.round((dados.entrada ?? 0) * 100);
        const saldo = Math.round(total * 100) - entrada;
        if (saldo < 0) throw new ErroVenda("A entrada não pode superar o total.", 400);
        if (entrada > 0) await executarSQL(conexao, "INSERT INTO PAGAMENTOS(venda_id, empresa_id, valor) VALUES(?, ?, ?)", [venda.id, empresa_id, entrada / 100]);
        if (saldo === 0) await executarSQL(conexao, "UPDATE VENDAS SET status = 'pago' WHERE id = ? AND empresa_id = ?", [venda.id, empresa_id]);
        if (dados.parcelamento) {
            const { quantidade, primeiro_vencimento } = dados.parcelamento;
            if (saldo < quantidade) throw new ErroVenda("O saldo deve permitir parcelas de pelo menos um centavo.", 400);
            const inicio = new Date(primeiro_vencimento + 'T00:00:00Z');
            for (let i = 0; i < quantidade; i++) {
                const data = new Date(inicio);
                data.setUTCDate(1);
                data.setUTCMonth(inicio.getUTCMonth() + i);
                const ultimoDia = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + 1, 0)).getUTCDate();
                data.setUTCDate(Math.min(inicio.getUTCDate(), ultimoDia));
                const valor = Math.floor(saldo / quantidade) + (i < saldo % quantidade ? 1 : 0);
                await executarSQL(conexao, "INSERT INTO PARCELAS(venda_id, empresa_id, numero, valor, vencimento) VALUES(?, ?, ?, ?, ?)", [venda.id, empresa_id, i + 1, valor / 100, data.toISOString().slice(0,10)]);
            }
        }
        return await buscarVendaNaConexao(conexao, empresa_id, venda.id);

    });

}
