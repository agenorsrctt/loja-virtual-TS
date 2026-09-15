import { gerarHashSenha } from "../../middleware/senha.util.js";
import type { CriarUsuarioDto } from "../dtos/interfacesUsuario.js";
import type { Tipo } from "../dtos/typesUsuario.js";
import { criarUsuarioRepository } from "../repositories/criarUsuario.repository.js";


export async function criarUsuariosService(dados: CriarUsuarioDto, tipo: Tipo, empresa_id: number): Promise<void> {

    if (tipo !== "admin" && tipo !== "gerente") {
        throw new Error("Usuario sem permissão, tente novamente.");
    }

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

    if (!empresa_id || empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    const senhaHash = await gerarHashSenha(dados.senha);
    const usuario = {
        ...dados,
        senha: senhaHash
    }

    return await criarUsuarioRepository(usuario, empresa_id);
}