import db from "../../../database/connection.js";
import type { Status } from "../dtos/empresa.dto.js";

export function inativarEmpresaRepository(id: number): Promise<void> {

    const sql = "UPDATE EMPRESAS SET status = ? WHERE id = ?";

    const status: Status = "inativo";

    return new Promise<void>((resolve, reject) => {

        db.run(sql, [status, id], async function (erro) {

            if (erro) {
                return reject(new Error("Repository - ERROR: " + erro));
            };

            if (this.changes === 0) {
                return reject(new Error("Repository - Changes: " + erro));
            };

            resolve();

        });

    });

};