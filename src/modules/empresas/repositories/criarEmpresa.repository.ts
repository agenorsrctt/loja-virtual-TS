import db from "../../../database/connection.js";

import type { CriarEmpresaDTO } from "../dtos/criarEmpresa.dto.js";

import type { EmpresaDTO } from "../dtos/empresa.dto.js";

export function criarEmpresaRepository(dados: CriarEmpresaDTO): Promise<EmpresaDTO> {

    const sql = "INSERT INTO EMPRESAS(empresa, cnpj, status) VALUES(?, ?, ?)";

    const valores: string[] = [dados.empresa, dados.cnpj, "ativo"];

    return new Promise<EmpresaDTO>((resolve, reject) => {

        db.run(sql, valores, function (erro) {

            if (erro) {
                return reject(erro);

            }

            resolve({ id: this.lastID, empresa: dados.empresa, cnpj: dados.cnpj, status: "ativo" });

        });

    });

}
