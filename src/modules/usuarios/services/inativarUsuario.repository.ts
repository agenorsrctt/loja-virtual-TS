import { invativarUsuariosRepository } from "../repositories/inativarUsuario.repositories.js";

export async function inativarUsuarioService(empresa_id: number, id: number): Promise<void>{

    if(empresa_id !== undefined && !empresa_id && empresa_id <= 0){
        throw new Error("Empresa inválida, tente novamente.")
    };

    if(id !== undefined && !id && id <= 0){
        throw new Error("Usuario não localizado, tente novamente.");
    };


    return await invativarUsuariosRepository(empresa_id, id);
}
