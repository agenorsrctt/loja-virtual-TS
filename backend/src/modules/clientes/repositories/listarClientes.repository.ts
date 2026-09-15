import db from "../../../database/connection.js";

import type { ClienteDTO } from "../dtos/cliente.dto.js";

export function listarClientesRepository(empresa_id: number): Promise<ClienteDTO[]> {

    const sql = "SELECT * FROM CLIENTES WHERE empresa_id = ?";

    const valores: number[] = [empresa_id];

    return new Promise<ClienteDTO[]>((resolve, reject) => {

        db.all<ClienteDTO>(sql, valores, (erro, clientes) => {

            if (erro) {
                return reject(erro);

            }

            resolve(clientes);

        });

    });

}
