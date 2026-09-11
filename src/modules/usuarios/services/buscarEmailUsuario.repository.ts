import type { loginUsuarioDTO } from "../dtos/interfacesUsuario.js";
import { buscarEmailUsuarioRepository } from "../repositories/buscarEmailUsuario.repository.js";


export async function buscarEmailUsuarioService(email: string) {
    
    if(!email){
        throw new Error("E-mail invalido, tente novamente");
    };

    return await buscarEmailUsuarioRepository(email);
}