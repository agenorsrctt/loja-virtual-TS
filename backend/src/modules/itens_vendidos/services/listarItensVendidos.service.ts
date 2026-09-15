import { listarItensVendidosRepository } from "../repositories/listarItensVendidos.repository.js";

import { validarIdVenda } from "../../vendas/utils/validarVenda.util.js";

export async function listarItensVendidosService(empresa_id: number, venda_id?: number) {

    validarIdVenda(empresa_id, "Empresa");

    if (venda_id !== undefined) {

        validarIdVenda(venda_id, "Venda");

    }

    return await listarItensVendidosRepository(empresa_id, venda_id);

}
