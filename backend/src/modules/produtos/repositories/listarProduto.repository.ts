import db from "../../../database/connection.js";
import type { ProdutosDTO } from "../dtos/interfaceProduto.js";

export function listarProdutoRepository(empresa_id: number): Promise<ProdutosDTO[]> {
    const sql = "SELECT * FROM PRODUTOS WHERE empresa_id = ?";
    const valores: number[] = [empresa_id];

    return new Promise<ProdutosDTO[]>((resolve, reject) => {
        db.all<ProdutosDTO>(sql, valores, (erro, produtos) => {
            if (erro) {
                return reject(erro);
            }

            resolve(produtos);
        });
    });
}
