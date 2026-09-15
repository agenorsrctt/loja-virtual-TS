import { listarVendasRepository } from "../repositories/listarVendas.repository.js";

import { validarIdVenda } from "../utils/validarVenda.util.js";

export async function listarVendasService(empresa_id: number) {

    validarIdVenda(empresa_id, "Empresa");

    return await listarVendasRepository(empresa_id);

}
