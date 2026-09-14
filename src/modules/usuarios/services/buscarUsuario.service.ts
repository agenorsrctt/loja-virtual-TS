import type { UsuarioDto } from "../dtos/interfacesUsuario.js";
import type { Tipo } from "../dtos/typesUsuario.js";
import { buscarUsuarioRepository } from "../repositories/buscarUsuario.repository.js";


export async function buscarUsuarioService(empresa_id: number, id: number, tipo: Tipo): Promise<UsuarioDto> {

    if (tipo !== "admin" && tipo !== "gerente") {
        throw new Error("Usuario sem permissão, tente novamente.");
    }

    if (!empresa_id || empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    if (!id || id <= 0) {
        throw new Error("Usuario não localizado, tente novamente.");
    }


    return await buscarUsuarioRepository(empresa_id, id);
};