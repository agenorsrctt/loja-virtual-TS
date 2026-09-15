import type { ClienteDTO } from "../dtos/cliente.dto.js";
import { listarClientesRepository } from "../repositories/listarClientes.repository.js";

export async function listarClientesService(empresa_id: number): Promise<ClienteDTO[]> {
    if (!Number.isInteger(empresa_id) || empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    return await listarClientesRepository(empresa_id);
}
