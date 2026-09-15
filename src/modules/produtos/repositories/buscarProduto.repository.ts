import db from "../../../database/connection.js";
import type { ProdutosDTO } from "../dtos/interfaceProduto.js";

export function buscarProdutoRepository(empresa_id: number, id: number): Promise<ProdutosDTO | undefined> {
    const sql = "SELECT * FROM PRODUTOS WHERE empresa_id = ? AND id = ?";
    const valores: number[] = [empresa_id, id];

    return new Promise<ProdutosDTO | undefined>((resolve, reject) => {
        db.get<ProdutosDTO>(sql, valores, (erro, produto) => {
            if (erro) {
                return reject(erro);
            }

            resolve(produto);
        });
    });
}
