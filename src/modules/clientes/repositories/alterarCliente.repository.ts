import db from "../../../database/connection.js";

import type { AlterarClienteDTO } from "../dtos/cliente.dto.js";

export function alterarClienteRepository(dados: AlterarClienteDTO, empresa_id: number, id: number): Promise<void> {

    const campos: string[] = [];

    const valores: (string | number)[] = [];

    if (dados.nome !== undefined) {
        campos.push("nome = ?");

        valores.push(dados.nome);

    }

    if (dados.email !== undefined) {
        campos.push("email = ?");

        valores.push(dados.email);

    }

    if (dados.telefone !== undefined) {
        campos.push("telefone = ?");

        valores.push(dados.telefone);

    }

    if (dados.status !== undefined) {
        campos.push("status = ?");

        valores.push(dados.status);

    }

    if (campos.length === 0) {
        return Promise.reject(new Error("Informe ao menos um campo para alterar."));

    }

    valores.push(empresa_id);

    valores.push(id);

    const sql = "UPDATE CLIENTES SET " + campos.join(", ") + " WHERE empresa_id = ? AND id = ?";

    return new Promise<void>((resolve, reject) => {

        db.run(sql, valores, function (erro) {

            if (erro) {
                return reject(erro);

            }

            if (this.changes === 0) {
                return reject(new Error("Cliente não encontrado."));

            }

            resolve();

        });

    });

}
