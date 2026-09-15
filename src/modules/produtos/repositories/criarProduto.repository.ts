import type { CriarProdutoDTO } from "../dtos/interfaceProduto.js";
import db from "../../../database/connection.js";


export function criarProdutoRepository(dados: CriarProdutoDTO, empresa_id: number): Promise<CriarProdutoDTO> {
    const sql = "INSERT INTO PRODUTOS(empresa_id, produto, estoque, preco, categoria, codigo, status) VALUES(?, ?, ?, ?, ?, ?, ?)";

    const valores: (string | number)[] = [
        dados.empresa_id,
        dados.produto,
        dados.estoque,
        dados.preco,
        dados.categoria,
        dados.codigo,
        dados.status
    ]

    valores.push(empresa_id);

    return new Promise<CriarProdutoDTO>((resolve, reject) => {
        db.run(sql, valores, function (erro) {
            if(erro) {
                return reject(erro)
            }

            resolve(dados);
        })
    })
}