import { cancelarVendaRepository } from "../repositories/cancelarVenda.repository.js";

import { validarIdVenda } from "../utils/validarVenda.util.js";

export async function cancelarVendaService(empresa_id: number, id: number) {

    validarIdVenda(empresa_id, "Empresa");

    validarIdVenda(id, "Venda");

    return await cancelarVendaRepository(empresa_id, id);

}
