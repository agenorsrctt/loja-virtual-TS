import type { CriarUsuarioDto } from "../dtos/interfacesUsuario.js";
import { criarUsuarioRepository } from "../repositories/criarUsuario.repository.js";


export async function criarUsuariosService(dados: CriarUsuarioDto): Promise<void> {

    if (!dados.nome.trim()) {
        throw new Error("Nome inválido, tente novamente.");
    };

    if (!["admin", "gerente", "colaborador"].includes(dados.tipo)) {
        throw new Error("Tipo inválido, tente novamente.");
    }

    if (!dados.email.trim() || !dados.email.includes("@")) {
        throw new Error("E-mail inválido, tente novamente.");
    }

    if (!dados.senha.trim()) {
        throw new Error("Senha inválida, tente novamente.");
    }


    return await criarUsuarioRepository(dados);
}