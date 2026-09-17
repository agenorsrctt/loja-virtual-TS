import type { ConexaoBanco } from "../../../database/conexaoBanco.js";

import type { VendaDTO, VendaDetalhadaDTO } from "../dtos/venda.dto.js";

import type { ItemVendidoDTO } from "../../itens_vendidos/dtos/itemVendido.dto.js";

import { buscarSQL, listarSQL, executarTransacaoVenda } from "./transacaoVenda.repository.js";

import { ErroVenda } from "../utils/erroVenda.util.js";

export async function buscarVendaNaConexao(conexao: ConexaoBanco, empresa_id: number, id: number): Promise<VendaDetalhadaDTO> {

    const venda = await buscarSQL<VendaDTO>(conexao, "SELECT * FROM VENDAS WHERE empresa_id = ? AND id = ?", [empresa_id, id]);

    if (!venda) {

        throw new ErroVenda("Venda não encontrada.", 404);

    }

    const itens = await listarSQL<ItemVendidoDTO>(conexao,
        "SELECT * FROM ITENS_VENDIDOS WHERE empresa_id = ? AND venda_id = ? ORDER BY id", [empresa_id, id]);

    const pagamentos = await listarSQL<VendaDetalhadaDTO['pagamentos'][number]>(conexao, "SELECT id, valor, data FROM PAGAMENTOS WHERE empresa_id = ? AND venda_id = ? ORDER BY id", [empresa_id, id]);
    const parcelas = await listarSQL<VendaDetalhadaDTO['parcelas'][number]>(conexao, "SELECT id, numero, valor, vencimento FROM PARCELAS WHERE empresa_id = ? AND venda_id = ? ORDER BY numero", [empresa_id, id]);
    const pago = pagamentos.reduce((s, p) => s + Math.round(p.valor * 100), 0);
    const total = Math.round(venda.valor_total * 100);
    const parcelado = parcelas.reduce((s, p) => s + Math.round(p.valor * 100), 0);
    // A entrada não integra as parcelas. Recebimentos seguintes quitam as mais antigas primeiro.
    let disponivel = Math.max(0, pago - (total - parcelado));
    for (const parcela of parcelas) {
        const valor = Math.round(parcela.valor * 100);
        const recebido = Math.min(valor, disponivel);
        parcela.valor_pago = recebido / 100;
        parcela.saldo = (valor - recebido) / 100;
        disponivel -= recebido;
    }
    return { ...venda, itens, pagamentos, parcelas, valor_pago: pago / 100, saldo: (total - pago) / 100 };

}

export function buscarVendaRepository(empresa_id: number, id: number): Promise<VendaDetalhadaDTO> {

    return executarTransacaoVenda((conexao) => buscarVendaNaConexao(conexao, empresa_id, id));

}
