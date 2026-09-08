import type { alterarEmpresaDTO } from "../dtos/alterarEmpresa.dto.js";
import type { Empresa } from "../dtos/empresa.dto.js";
import { alterarEmpresaRepository } from "../repositories/alterarEmpresa.repository.js";

export async function alterarEmpresaService(dados: alterarEmpresaDTO, id: number): Promise<void> {

    if (dados.empresa !== undefined) {
        if (dados.empresa.trim() === "") {
            throw new Error("Nome inválido, tente novamente.");
        }
    }

    if (dados.cnpj !== undefined) {
        if (dados.cnpj.trim() === "") {
            throw new Error("CNPJ inválido, tente novamente.");
        }
    }

    if (dados.status) {
        if (dados.status !== "ativo" && dados.status !== "inativo") {
            throw new Error("Status inválido, tente novamente.");
        }
    }

    return alterarEmpresaRepository(dados, id);
}