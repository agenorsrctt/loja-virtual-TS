import type { AlterarUsuarioDto } from "../dtos/interfacesUsuario.js";


export async function alterarUsuarioService(dados: AlterarUsuarioDto): Promise<void> {
    if(dados.nome !== undefined && !dados.nome.trim() ) {
        throw new Error("Nome inválido, tente novamente.");
    };

    if(dados.tipo !== undefined && !["admin", "gerente", "colaborador"].includes(dados.tipo)) {
        throw new Error("Tipo inválido, tente novamente.");
    }

    if(dados.email !== undefined && !dados.email.trim() && dados.email.includes("@")) {
        throw new Error("E-mail inválido, tente novamente.");
    }

    if(dados.status !== undefined && !["ativo","inativo"].includes(dados.status)) {
        throw new Error("Status inválido, tente novamente.");
    }

    if(dados.senha !== undefined && !dados.senha.trim()) {
        throw new Error("Senha inválida, tente novamente.");
    }
}