import type { CriarUsuarioDto } from "../dtos/interfacesUsuario.js";
import { criarUsuarioRepository } from "../repositories/criarUsuario.repository.js";


export async function criarUsuariosService(dados: CriarUsuarioDto): Promise<void> {
    
    if(!dados.nome.trim()) {
        throw new Error("Nome inválido, tente novamente.")
    }

    if(!dados.tipo){
        throw new Error("Tipo não informado.")
    }

    if(!dados.email.trim()){
        throw new Error("E-mail não informado.")
    }

    if(!dados.status){
        throw new Error("Status do usuário não informado.");
    }

    if(!dados.senha){
        throw new Error("Senha não informada.");
    }


    return await criarUsuarioRepository(dados);
}