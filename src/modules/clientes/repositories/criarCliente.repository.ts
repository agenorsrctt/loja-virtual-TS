import type { CriarClienteDTO, ClienteDTO } from "../dtos/cliente.dto.js";

import db from "../../../database/connection.js";

export function criarClienteRepository(dados: CriarClienteDTO, empresa_id: number): Promise<ClienteDTO> {

    const sql = "INSERT INTO CLIENTES(empresa_id, nome, email, telefone, status) VALUES(?, ?, ?, ?, ?)";

    const valores: (string | number | null)[] = [
        empresa_id,
        dados.nome,
        dados.email ?? null,
        dados.telefone,
        dados.status
    ];

    return new Promise<ClienteDTO>((resolve, reject) => {

        db.run(sql, valores, function (erro) {

            if (erro) {
                return reject(erro);

            }

            resolve({
                id: this.lastID,
                empresa_id,
                nome: dados.nome,
                email: dados.email ?? null,
                telefone: dados.telefone,
                status: dados.status
            });

        });

    });

}
