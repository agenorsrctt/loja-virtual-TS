import db from "../../../database/connection.js";

import type { EmpresaDTO } from "../dtos/empresa.dto.js";

export function listarEmpresasRepository(): Promise<EmpresaDTO[]> {

    const sql = "SELECT * FROM EMPRESAS";

    const valores: number[] = [];

    return new Promise<EmpresaDTO[]>((resolve, reject) => {

        db.all<EmpresaDTO>(sql, valores, (erro, empresas) => {

            if (erro) {
                return reject(erro);

            }

            resolve(empresas);

        });

    });

}
