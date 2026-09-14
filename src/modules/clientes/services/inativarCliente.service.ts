import { inativarClienteRepository } from "../repositories/inativarCliente.repository.js"

export async function inativarClienteService( empresa_id: number, id: number) {

    if(!id && !empresa_id) {
        throw new Error("Cliente inválido, tente novamente.")
    }

    return await inativarClienteRepository(empresa_id, id);
}