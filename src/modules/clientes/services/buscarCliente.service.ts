import type { ClienteDTO } from "../dtos/interfacesCliente.dto.js";
import { buscarClienteRepository } from "../repositories/buscarCliente.repository.js";


export async function buscarClienteService(empresa_id: number, id: number): Promise<ClienteDTO> {

    if(!empresa_id && !id){
        throw new Error("Cliente não localizado, tente novamente.")
    }


    return await buscarClienteRepository(empresa_id, id);
}