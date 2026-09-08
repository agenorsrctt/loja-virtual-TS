import type { criarClienteDTO } from "./cliente.dto.js";
import { criarClienteRepository } from "./cliente.repository.js";

export async function criarClienteService(dados: criarClienteDTO) {

    if (!dados.empresa_id) {
        throw new Error("ID da empresa necessário na solicitação de criação.")
    }

    if (!dados.nome) {
        throw new Error("Nome inválido, tente novamente.")
    }

    if (dados.email) {
        if (!dados.email?.includes("@")) {
            throw new Error('Formato de e-mail inválido, verifique ("meuemail@email.com") e tente novamente.')
        }
    }

    if (!dados.telefone) {
        throw new Error("Telefone inválido, tente novamente.")
    }

    if(dados.status !== "ativo" && dados.status !== "inativo") {
        throw new Error("Status inválido, tente novamente.")
    }

    return await criarClienteRepository(dados);
}