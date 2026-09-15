import type { CriarProdutoDTO, ProdutosDTO } from "../dtos/interfaceProduto.js";
import db from "../../../database/connection.js";

export function criarProdutoRepository(dados: CriarProdutoDTO, empresa_id: number): Promise<ProdutosDTO> {
    const sql = "INSERT INTO PRODUTOS(empresa_id, produto, estoque, preco, categoria, codigo, status) VALUES(?, ?, ?, ?, ?, ?, ?)";
    
    const valores: (string | number)[] = [
        empresa_id,
        dados.produto,
        dados.estoque,
        dados.preco,
        dados.categoria,
        dados.codigo,
        dados.status
    ];

    return new Promise<ProdutosDTO>((resolve, reject) => {
        db.run(sql, valores, function (erro) {
            if (erro) {
                return reject(erro);
            }

            resolve({
                ...dados,
                id: this.lastID,
                empresa_id
            });
        });
    });
}
