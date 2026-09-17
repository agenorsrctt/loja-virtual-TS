import type { CriarVendaDTO } from "../dtos/venda.dto.js";

import { criarVendaRepository } from "../repositories/criarVenda.repository.js";

import { validarCondicoes, validarIdVenda, validarDadosVenda, validarItensVenda } from "../utils/validarVenda.util.js";

export async function criarVendaService(dados: CriarVendaDTO, empresa_id: number, usuario_id: number) {

    validarIdVenda(empresa_id, "Empresa");

    validarIdVenda(usuario_id, "Usuário");

    validarDadosVenda(dados);
    validarCondicoes(dados);

    validarIdVenda(dados.cliente_id, "Cliente");

    validarItensVenda(dados.itens);

    return await criarVendaRepository(dados, empresa_id, usuario_id);

}
