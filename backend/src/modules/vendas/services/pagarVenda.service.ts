import { pagarVendaRepository } from "../repositories/pagarVenda.repository.js";

import { validarIdVenda, validarDinheiro, validarDadosVenda } from "../utils/validarVenda.util.js";

export async function pagarVendaService(empresa_id: number, id: number, dados: unknown = {}) {
    validarDadosVenda(dados);
    if (dados.valor !== undefined) validarDinheiro(dados.valor);

    validarIdVenda(empresa_id, "Empresa");

    validarIdVenda(id, "Venda");

    return await pagarVendaRepository(empresa_id, id, dados.valor as number | undefined);

}
