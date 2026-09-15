import db from "../../../database/connection.js";
import type { ClienteDTO } from "../dtos/cliente.dto.js";

export function buscarClienteRepository(empresa_id: number, id: number): Promise<ClienteDTO | undefined> {
    const sql = "SELECT * FROM CLIENTES WHERE empresa_id = ? AND id = ?";
    const valores: number[] = [empresa_id, id];

    return new Promise<ClienteDTO | undefined>((resolve, reject) => {
        db.get<ClienteDTO>(sql, valores, (erro, cliente) => {
            if (erro) {
                return reject(erro);
            }

            resolve(cliente);
        });
    });
}
