import db from "../../../database/connection.js";

export function inativarEmpresaRepository(id: number): Promise<void> {

    const sql = "UPDATE EMPRESAS SET status = 'inativo' WHERE id = ?";

    const valores: number[] = [id];

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
