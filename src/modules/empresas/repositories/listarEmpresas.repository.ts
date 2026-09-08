import db from "../../../database/connection.js";
import type { Empresa } from "../dtos/empresa.dto.js";


export function listarEmpresasRepository(): Promise<Empresa[]> {

    const sql: string = "SELECT * FROM EMPRESAS";

    return new Promise<Empresa[]>((resolve, reject) => {
        db.all<Empresa>(sql, (erro, empresas) => {
            if(erro) {
                return reject(new Error("Repository - ERROR: " + erro));
            };

            resolve(empresas);
        });
    });
};