import type { AlterarVendaDTO } from "../dtos/venda.dto.js";

import { alterarVendaRepository } from "../repositories/alterarVenda.repository.js";

import { validarCondicoes, validarIdVenda, validarDadosVenda, validarItensVenda } from "../utils/validarVenda.util.js";

import { ErroVenda } from "../utils/erroVenda.util.js";

export async function alterarVendaService(dados: AlterarVendaDTO, empresa_id: number, usuario_id: number, id: number) {

    validarIdVenda(empresa_id, "Empresa");

    validarIdVenda(usuario_id, "Usuário");

    validarIdVenda(id, "Venda");

    validarDadosVenda(dados);
    validarCondicoes(dados);

    if (dados.cliente_id === undefined && dados.itens === undefined && dados.comentarios === undefined) {

        throw new ErroVenda("Informe ao menos um campo para alterar.", 400);

    }

    if (dados.cliente_id !== undefined) {

        validarIdVenda(dados.cliente_id, "Cliente");

    }

    if (dados.itens !== undefined) {

        validarItensVenda(dados.itens);

    }

    return await alterarVendaRepository(dados, empresa_id, usuario_id, id);

}
