import { listarClienteRepository } from "../repositories/listarClientes.repository.js";

export async function listarClienteService(empresa_id: number){
    if(!empresa_id) {
        throw new Error("Empresa inválida, tente novamente.")
    };

    return await listarClienteRepository(empresa_id);
}