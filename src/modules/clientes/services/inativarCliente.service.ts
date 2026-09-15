import { inativarClienteRepository } from "../repositories/inativarCliente.repository.js";

export async function inativarClienteService(empresa_id: number, id: number) {
    if (!Number.isInteger(empresa_id) || empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Cliente inválido, tente novamente.");
    }

    return await inativarClienteRepository(empresa_id, id);
}
