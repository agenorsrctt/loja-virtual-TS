import type { UsuarioDto } from "../dtos/interfacesUsuario.js";
import { buscarUsuarioRepository } from "../repositories/buscarUsuario.repository.js";


export async function buscarUsuarioService(empresa_id: number, id: number): Promise<UsuarioDto> {

    if(empresa_id !== undefined && !empresa_id && empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    };

    if(id !== undefined && !id && id <= 0 ) {
        throw new Error("Usuario não localizado, tente novamente");
    };


    return await buscarUsuarioRepository(empresa_id, id);
};