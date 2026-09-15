import db from "../../../database/connection.js";

export function inativarProdutoRepository(empresa_id: number, id: number): Promise<void> {
    const sql = "UPDATE PRODUTOS SET status = 'inativo' WHERE empresa_id = ? AND id = ?";
    const valores: number[] = [empresa_id, id];

    return new Promise<void>((resolve, reject) => {
        db.run(sql, valores, function (erro) {
            if (erro) {
                return reject(erro);
            }

            if (this.changes === 0) {
                return reject(new Error("Produto não encontrado."));
            }

            resolve();
        });
    });
}
