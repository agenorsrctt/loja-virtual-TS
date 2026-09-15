import db from "../../../database/connection.js";

import type { ItemVendidoDTO } from "../dtos/itemVendido.dto.js";

import { buscarSQL } from "../../vendas/repositories/transacaoVenda.repository.js";

export function buscarItemVendidoRepository(empresa_id: number, id: number): Promise<ItemVendidoDTO | undefined> {

    return buscarSQL<ItemVendidoDTO>(db, "SELECT * FROM ITENS_VENDIDOS WHERE empresa_id = ? AND id = ?", [empresa_id, id]);

}
