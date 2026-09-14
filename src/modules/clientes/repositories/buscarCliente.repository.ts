import db from "../../../database/connection.js";
import type { ClienteDTO } from "../dtos/interfacesCliente.dto.js";



export function buscarClienteRepository(empresa_id: number, id: number): Promise<ClienteDTO> {
    const sql = "SELECT * FROM CLIENTES WHERE empresa_id = ? AND id = ?";
    const valores: number[] = [];
    valores.push(empresa_id, id);

    return new Promise<ClienteDTO>((resolve, reject) => {
        db.get<ClienteDTO>(sql, valores, (erro, cliente) => {
            if (erro) {
                return reject(erro);
            }

            resolve(cliente);
        })
    })
}