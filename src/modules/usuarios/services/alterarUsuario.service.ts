import { gerarHashSenha } from "../../middleware/senha.util.js";
import type { AlterarUsuarioDto } from "../dtos/interfacesUsuario.js";
import type { Tipo } from "../dtos/typesUsuario.js";
import { alterarUsuarioRepository } from "../repositories/alterarUsuario.repository.js";


export async function alterarUsuarioService(dados: AlterarUsuarioDto, empresa_id: number, id: number, tipo: Tipo): Promise<void> {

    if (tipo !== "admin" && tipo !== "gerente") {
        throw new Error("Usuario sem permissão, tente novamente.");
    }

    if (!empresa_id || empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    if (!id || id <= 0) {
        throw new Error("Usuario não localizado, tente novamente.");
    }

    if (dados.nome !== undefined && !dados.nome.trim()) {
        throw new Error("Nome inválido, tente novamente.");
    };

    if (dados.tipo !== undefined && !["admin", "gerente", "colaborador"].includes(dados.tipo)) {
        throw new Error("Tipo inválido, tente novamente.");
    }

    if (dados.email !== undefined) {
        if (!dados.email.trim() || !dados.email.includes("@")) {
            throw new Error("E-mail inválido, tente novamente.");
        }
    }

    if (dados.status !== undefined && !["ativo", "inativo"].includes(dados.status)) {
        throw new Error("Status inválido, tente novamente.");
    }

    if (dados.senha !== undefined && !dados.senha.trim()) {
        throw new Error("Senha inválida, tente novamente.");
    }

    if (dados.senha) {
        dados.senha = await gerarHashSenha(dados.senha);
    }

    return await alterarUsuarioRepository(dados, empresa_id, id);
}