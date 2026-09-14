import db from "../../../database/connection.js";

export function inativarClienteRepository(empresa_id: number, id: number): Promise<void> {

    const valores: number[] = [];
    valores.push(empresa_id, id);

    const sql = "UPDATE CLIENTE SET status = 'inativo' WHERE empresa_id = ? AND id = ?";

    return new Promise<void>((resolve, reject) => {
        db.run<void>(sql, valores, function (erro) {
            if (erro) {
                return reject(erro)
            }

            if (this.changes === 0) {
                return reject(new Error("Cliente não encontrado."));
            }

            resolve();
        })
    })
}