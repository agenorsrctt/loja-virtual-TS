import db from "../../../database/connection.js";
import type { AlterarProdutoDTO } from "../dtos/interfaceProduto.js";

export function alterarProdutoRepository(dados: AlterarProdutoDTO, empresa_id: number, id: number): Promise<void> {
    const campos: string[] = [];
    const valores: (string | number)[] = [];

    if (dados.produto !== undefined) {
        campos.push("produto = ?");
        valores.push(dados.produto);
    }

    if (dados.estoque !== undefined) {
        campos.push("estoque = ?");
        valores.push(dados.estoque);
    }

    if (dados.preco !== undefined) {
        campos.push("preco = ?");
        valores.push(dados.preco);
    }

    if (dados.categoria !== undefined) {
        campos.push("categoria = ?");
        valores.push(dados.categoria);
    }

    if (dados.codigo !== undefined) {
        campos.push("codigo = ?");
        valores.push(dados.codigo);
    }

    if (dados.status !== undefined) {
        campos.push("status = ?");
        valores.push(dados.status);
    }

    if (campos.length === 0) {
        return Promise.reject(new Error("Informe ao menos um campo para alterar."));
    }
    
    valores.push(empresa_id);
    valores.push(id);

    const sql = "UPDATE PRODUTOS SET " + campos.join(", ") + " WHERE empresa_id = ? AND id = ?";
    
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
