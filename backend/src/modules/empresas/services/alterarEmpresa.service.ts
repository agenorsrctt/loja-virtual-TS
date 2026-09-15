import type { AlterarEmpresaDTO } from "../dtos/alterarEmpresa.dto.js";

import { alterarEmpresaRepository } from "../repositories/alterarEmpresa.repository.js";

export async function alterarEmpresaService(dados: AlterarEmpresaDTO, id: number): Promise<void> {

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");

    }

    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw new Error("Dados da empresa inválidos.");

    }

    if (dados.empresa === undefined && dados.cnpj === undefined && dados.status === undefined) {
        throw new Error("Informe ao menos um campo para alterar.");

    }

    if (dados.empresa !== undefined) {
        if (typeof dados.empresa !== "string" || !dados.empresa.trim()) {
            throw new Error("Nome inválido, tente novamente.");

        }

    }

    if (dados.cnpj !== undefined) {
        if (typeof dados.cnpj !== "string" || !dados.cnpj.trim()) {
            throw new Error("CNPJ inválido, tente novamente.");

        }

    }

    if (dados.status !== undefined && dados.status !== "ativo" && dados.status !== "inativo") {
        throw new Error("Status inválido, tente novamente.");

    }

    return await alterarEmpresaRepository(dados, id);

}
