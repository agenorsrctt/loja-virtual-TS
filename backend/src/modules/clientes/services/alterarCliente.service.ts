import type { AlterarClienteDTO } from "../dtos/cliente.dto.js";

import { alterarClienteRepository } from "../repositories/alterarCliente.repository.js";

export async function alterarClienteService(dados: AlterarClienteDTO, empresa_id: number, id: number) {

    if (!Number.isInteger(empresa_id) || empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");

    }

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Cliente inválido, tente novamente.");

    }

    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw new Error("Dados do cliente inválidos.");

    }

    if (
        dados.nome === undefined &&
        dados.email === undefined &&
        dados.telefone === undefined &&
        dados.status === undefined
    ) {
        throw new Error("Informe ao menos um campo para alterar.");

    }

    if (dados.nome !== undefined) {
        if (typeof dados.nome !== "string" || !dados.nome.trim()) {
            throw new Error("Nome inválido, tente novamente.");

        }

    }

    if (dados.email !== undefined) {
        if (typeof dados.email !== "string" || !dados.email.trim() || !dados.email.includes("@")) {
            throw new Error("E-mail inválido, tente novamente.");

        }

    }

    if (dados.telefone !== undefined) {
        if (typeof dados.telefone !== "string" || !dados.telefone.trim()) {
            throw new Error("Telefone inválido, tente novamente.");

        }

    }

    if (dados.status !== undefined) {
        if (dados.status !== "ativo" && dados.status !== "inativo") {
            throw new Error("Status inválido, tente novamente.");

        }

    }

    return await alterarClienteRepository(dados, empresa_id, id);

}
