import db from "../../../database/connection.js";

import type { ItemVendidoDTO } from "../dtos/itemVendido.dto.js";

import { listarSQL } from "../../vendas/repositories/transacaoVenda.repository.js";

export function listarItensVendidosRepository(empresa_id: number, venda_id?: number): Promise<ItemVendidoDTO[]> {

    const filtro = venda_id === undefined ? "" : " AND venda_id = ?";

    const valores = venda_id === undefined ? [empresa_id] : [empresa_id, venda_id];

    return listarSQL<ItemVendidoDTO>(db, "SELECT * FROM ITENS_VENDIDOS WHERE empresa_id = ?" + filtro + " ORDER BY id", valores);

}
