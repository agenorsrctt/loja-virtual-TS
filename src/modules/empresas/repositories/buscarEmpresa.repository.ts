import db from "../../../database/connection.js";
import type { EmpresaDTO } from "../dtos/empresa.dto.js";

export function buscarEmpresaRepository(id: number): Promise<EmpresaDTO | undefined> {
    const sql = "SELECT * FROM EMPRESAS WHERE id = ?";
    const valores: number[] = [id];

    return new Promise<EmpresaDTO | undefined>((resolve, reject) => {
        db.get<EmpresaDTO>(sql, valores, (erro, empresa) => {
            if (erro) {
                return reject(erro);
            }

            resolve(empresa);
        });
    });
}
