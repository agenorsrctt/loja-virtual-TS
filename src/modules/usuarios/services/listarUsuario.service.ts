import type { UsuarioDto } from "../dtos/interfacesUsuario.js";
import type { Tipo } from "../dtos/typesUsuario.js";
import { listarUsuarioRepository } from "../repositories/listarUsuario.repository.js";


export async function listarUsuariosService(empresa_id: number, tipo: Tipo): Promise<UsuarioDto[]> {

    if (tipo !== "admin" && tipo !== "gerente") {
        throw new Error("Usuario sem permissão, tente novamente.");
    }
    
    if(empresa_id !== undefined && !empresa_id && empresa_id <= 0){
        throw new Error("Empresa inválida, tente novamente.");
    };

    return await listarUsuarioRepository(empresa_id);

}