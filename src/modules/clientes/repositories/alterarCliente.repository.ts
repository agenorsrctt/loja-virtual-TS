import db from "../../../database/connection.js";
import type { alterarClienteDTO } from "../dtos/interfacesCliente.dto.js";
 
export function alterarCliente(dados: alterarClienteDTO): Promise<void> {
    const valores: (string | number)[] = [];
    const campos: string[] = [];

    if(dados.nome) {
        valores.push(dados.nome);
        campos.push("nome = ?");
    }

    if(dados.email) {
        valores.push(dados.email);
        campos.push("email = ?")
    }

    if(dados.telefone) {
        valores.push(dados.telefone);
        campos.push("telefone = ?")
    }

    if(dados.status) {
        valores.push(dados.status);
        campos.push("status = ?")
    }

    if(dados.senha) {
        valores.push(dados.senha);
        campos.push("senha = ?")
    }

    valores.push(dados.empresa_id, dados.id);

    const sql = `UPDATE CLIENTES SET ${campos.join(", ")} WHERE empresa_id = ? AND id = ?`

    return new Promise<void>((resolve, reject) => {
        db.run(sql, valores, function (erro) {
            if(erro) {
                return reject(new Error("Cliente Repository Error:" +erro));
            };
            
            if(this.changes === 0) {
                reject(new Error("Cliente Repository Error: Nenhuma alteração realizada"));
            }

            resolve();
        });
    });
};