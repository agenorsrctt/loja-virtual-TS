import { buscarEmailUsuarioRepository } from "../repositories/buscarEmailUsuario.repository.js";


export async function buscarEmailUsuarioService(email: string, empresa_id: number) {
    
    if(!email){
        throw new Error("E-mail invalido, tente novamente");
    };

    return await buscarEmailUsuarioRepository(email, empresa_id);
}