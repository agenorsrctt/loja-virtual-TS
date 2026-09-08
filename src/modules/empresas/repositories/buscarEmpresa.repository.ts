import db from "../../../database/connection.js";
import type { Empresa } from "../dtos/empresa.dto.js";

export function buscarEmpresasPorIDRepository(id: number): Promise<Empresa> {
    const sql = "SELECT * FROM EMPRESAS WHERE id = ?";

    return new Promise<Empresa>((resolve, reject) => {
        db.get<Empresa>(sql, id, (erro, empresa) => {
            if(erro) {
                return reject(new Error("Repository - ERROR: " + erro));
            };

            resolve(empresa);
        });
    });
};