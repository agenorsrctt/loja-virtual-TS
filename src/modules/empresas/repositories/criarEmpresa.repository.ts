import db from "../../../database/connection.js";
import type { criarEmpresaDTO } from "../dtos/criarEmpresa.dto.js";

export function criarEmpresaRepository(dados: criarEmpresaDTO): Promise<number> {

    const sql = "INSERT INTO EMPRESAS(empresa, cnpj, status) VALUES(?,?,?)";
    
    const valores: string[] = [
        dados.empresa,
        dados.cnpj,
        "ativo"
    ];

    return new Promise<number>((resolve, reject) => {

        db.run(sql, valores, function (erro) {
            if (erro) {
                return reject(new Error("Repository - ERROR: " + erro));
            };

            resolve(this.lastID);
        });

    });

};