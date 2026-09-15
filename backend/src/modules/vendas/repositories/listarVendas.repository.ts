import db from "../../../database/connection.js";

import type { VendaDTO } from "../dtos/venda.dto.js";

import { listarSQL } from "./transacaoVenda.repository.js";

export function listarVendasRepository(empresa_id: number): Promise<VendaDTO[]> {

    return listarSQL<VendaDTO>(db, "SELECT * FROM VENDAS WHERE empresa_id = ? ORDER BY id DESC", [empresa_id]);

}
