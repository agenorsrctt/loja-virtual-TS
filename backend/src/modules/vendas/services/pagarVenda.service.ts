import { pagarVendaRepository } from "../repositories/pagarVenda.repository.js";

import { validarIdVenda } from "../utils/validarVenda.util.js";

export async function pagarVendaService(empresa_id: number, id: number) {

    validarIdVenda(empresa_id, "Empresa");

    validarIdVenda(id, "Venda");

    return await pagarVendaRepository(empresa_id, id);

}
