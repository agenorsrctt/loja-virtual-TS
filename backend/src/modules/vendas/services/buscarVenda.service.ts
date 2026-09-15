import { buscarVendaRepository } from "../repositories/buscarVenda.repository.js";

import { validarIdVenda } from "../utils/validarVenda.util.js";

export async function buscarVendaService(empresa_id: number, id: number) {

    validarIdVenda(empresa_id, "Empresa");

    validarIdVenda(id, "Venda");

    return await buscarVendaRepository(empresa_id, id);

}
