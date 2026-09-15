import type sqlite3 from "sqlite3";

import type { VendaDTO, VendaDetalhadaDTO } from "../dtos/venda.dto.js";

import type { ItemVendidoDTO } from "../../itens_vendidos/dtos/itemVendido.dto.js";

import { buscarSQL, listarSQL, executarTransacaoVenda } from "./transacaoVenda.repository.js";

import { ErroVenda } from "../utils/erroVenda.util.js";

export async function buscarVendaNaConexao(conexao: sqlite3.Database, empresa_id: number, id: number): Promise<VendaDetalhadaDTO> {

    const venda = await buscarSQL<VendaDTO>(conexao, "SELECT * FROM VENDAS WHERE empresa_id = ? AND id = ?", [empresa_id, id]);

    if (!venda) {

        throw new ErroVenda("Venda não encontrada.", 404);

    }

    const itens = await listarSQL<ItemVendidoDTO>(conexao,
        "SELECT * FROM ITENS_VENDIDOS WHERE empresa_id = ? AND venda_id = ? ORDER BY id", [empresa_id, id]);

    return { ...venda, itens };

}

export function buscarVendaRepository(empresa_id: number, id: number): Promise<VendaDetalhadaDTO> {

    return executarTransacaoVenda((conexao) => buscarVendaNaConexao(conexao, empresa_id, id));

}
