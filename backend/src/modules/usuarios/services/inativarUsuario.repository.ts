import type { Tipo } from "../dtos/typesUsuario.js";
import { invativarUsuariosRepository } from "../repositories/inativarUsuario.repositories.js";

export async function inativarUsuarioService(empresa_id: number, id: number, tipo: Tipo): Promise<void> {

    if (!empresa_id || empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    if (!id || id <= 0) {
        throw new Error("Usuario não localizado, tente novamente.");
    }

    if (tipo !== "admin" && tipo !== "gerente") {
        throw new Error("Usuario sem permissão, tente novamente.")
    }


    return await invativarUsuariosRepository(empresa_id, id);
}
