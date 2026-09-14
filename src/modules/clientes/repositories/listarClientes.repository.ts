import db from "../../../database/connection.js";
import type { ClienteDTO } from "../dtos/interfacesCliente.dto.js";



export function listarClienteRepository(empresa_id: number): Promise<ClienteDTO[]>{

    const sql = "SELECT * FROM CLIENTES WHERE empresa_id = ?";
    const valores: number[] = [];

    valores.push(empresa_id);

    return new Promise<ClienteDTO[]>((resolve, reject) => {
        db.all<ClienteDTO>(sql, valores, (erro, clientes) => {
            if(erro){
                return reject(erro);
            }

            resolve(clientes);
        })
    })
}