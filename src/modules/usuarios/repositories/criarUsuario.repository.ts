import db from "../../../database/connection.js";
import type { CriarUsuarioDto } from "../dtos/interfacesUsuario.js";

export function criarUsuarioRepository(dados: CriarUsuarioDto): Promise<void> {

    const sql = "INSERT INTO USUARIOS(empresa_id, nome, tipo, email, status, senha) VALUES(?, ?, ?, ?, ?, ?)";

    const valores: (string | number)[] = [
        dados.empresa_id,
        dados.nome,
        dados.tipo,
        dados.email,
        "ativo", /* status */
        dados.senha
    ];

    return new Promise<void>((resolve, reject) => {
        db.run(sql, valores, function (erro) {
            if (erro) {
                return reject(new Error("Repository - ERROR: " + erro));
            }

            resolve();
        });
    });
};