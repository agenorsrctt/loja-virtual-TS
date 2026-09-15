import type { AlterarEmpresaDTO } from "../dtos/alterarEmpresa.dto.js";

import db from "../../../database/connection.js";

export function alterarEmpresaRepository(dados: AlterarEmpresaDTO, id: number): Promise<void> {

    const valores: (string | number)[] = [];

    const campos: string[] = [];

    if (dados.empresa !== undefined) {
        valores.push(dados.empresa);

        campos.push("empresa = ?");

    }

    if (dados.cnpj !== undefined) {
        valores.push(dados.cnpj);

        campos.push("cnpj = ?");

    }

    if (dados.status !== undefined) {
        valores.push(dados.status);

        campos.push("status = ?");

    }

    if (valores.length === 0) {
        return Promise.reject(new Error("Informe ao menos um campo para alterar."));

    }

    valores.push(id);

    const sql = `UPDATE EMPRESAS SET ${campos.join(", ")} WHERE id = ?`;

    return new Promise<void>((resolve, reject) => {

        db.run(sql, valores, function (erro) {

            if (erro) {
                return reject(erro);

            }

            if (this.changes === 0) {
                return reject(new Error("Empresa não encontrada."));

            }

            resolve();

        });

    });

}
