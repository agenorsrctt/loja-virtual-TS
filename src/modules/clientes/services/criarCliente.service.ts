import type { CriarClienteDTO } from "../dtos/cliente.dto.js";
import { criarClienteRepository } from "../repositories/criarCliente.repository.js";

export async function criarClienteService(dados: CriarClienteDTO, empresa_id: number) {
    if (!Number.isInteger(empresa_id) || empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw new Error("Dados do cliente inválidos.");
    }

    if (typeof dados.nome !== "string" || !dados.nome.trim()) {
        throw new Error("Nome inválido, tente novamente.");
    }

    if (dados.email !== undefined) {
        if (typeof dados.email !== "string" || !dados.email.trim() || !dados.email.includes("@")) {
            throw new Error("E-mail inválido, tente novamente.");
        }
    }

    if (typeof dados.telefone !== "string" || !dados.telefone.trim()) {
        throw new Error("Telefone inválido, tente novamente.");
    }

    if (dados.status !== "ativo" && dados.status !== "inativo") {
        throw new Error("Status inválido, tente novamente.");
    }

    return await criarClienteRepository(dados, empresa_id);
}
