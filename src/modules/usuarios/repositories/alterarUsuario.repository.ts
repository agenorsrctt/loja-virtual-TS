import db from "../../../database/connection.js";
import type { AlterarUsuarioDto } from "../dtos/interfacesUsuario.js";

export function alterarUsuarioRepository(dados: AlterarUsuarioDto, empresa_id: number, id: number): Promise<void> {

    const valores: (string | number)[] = [];
    const campos: string[] = [];

    if (dados.nome) {
        valores.push(dados.nome);
        campos.push("nome = ?");
    }

    if (dados.tipo) {
        valores.push(dados.tipo);
        campos.push("tipo = ?");
    }

    if (dados.email) {
        valores.push(dados.email);
        campos.push("email = ?");
    }

    if(dados.senha) {
        valores.push(dados.senha);
        campos.push("senha = ?");
    }

    if(campos.length === 0) {
        throw new Error("Nenhuma alteração contabilizada."); 
    }

    const sql = `UPDATE USUARIOS SET ${campos.join(", ")} WHERE empresa_id = ? AND id = ?`;

    return new Promise<void>((resolve, reject) => {
        db.run(sql, [...valores, dados.empresa_id, dados.id],function (erro) {
            if (erro) {
                return reject(new Error("AlterarRepository Error: " + erro));
            }

            if (this.changes === 0) {
                return reject(new Error("AlterarRepository Error: Usuario não localizado." ));
            }

            resolve();
        })
    })
}