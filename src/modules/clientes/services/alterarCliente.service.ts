import type { alterarClienteDTO } from "../dtos/interfacesCliente.dto.js";
import { alterarClienteRepository } from "../repositories/alterarCliente.repository.js";


export async function alterarClienteService(dados: alterarClienteDTO, empresa_id: number, id: number){

    if(dados.nome !== undefined) {
        if(!dados.nome) {
            throw new Error("Nome inválido, tente novamente.");
        }
    }

    if(dados.email !== undefined && !dados.email) {
        throw new Error("E-mail inválido, tente novamente");
    }

    if(dados.telefone !== undefined && !dados.telefone) {
        throw new Error("Telefone inválido, tente novamente.")
    }

    if(dados.status !== undefined) {
        if(!["ativo", "inativo"].includes(dados.status)){
            throw new Error("Status inválido, tente novamente.")
        }
    }

    if(dados.empresa_id !== undefined && !dados.empresa_id) {
        throw new Error("Empresa inválida, tente novamente.")
    }

    if(dados.id !== undefined && !dados.id){
        throw new Error("Cliente inválido, tente novamente.")
    }

    return await alterarClienteRepository(dados, empresa_id, id);
}