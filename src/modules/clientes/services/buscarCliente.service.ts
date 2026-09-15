import { buscarClienteRepository } from "../repositories/buscarCliente.repository.js";

export async function buscarClienteService(empresa_id: number, id: number) {
    if (!Number.isInteger(empresa_id) || empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Cliente inválido, tente novamente.");
    }

    const cliente = await buscarClienteRepository(empresa_id, id);
    if (!cliente) {
        throw new Error("Cliente não encontrado.");
    }
    return cliente;
}
