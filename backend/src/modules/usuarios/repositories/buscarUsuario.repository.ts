import db from "../../../database/connection.js";
import type { UsuarioDto } from "../dtos/interfacesUsuario.js";

export function buscarUsuarioRepository(empresa_id: number, id: number): Promise<UsuarioDto> {

    const sql = "SELECT id, nome, email, tipo, status, empresa_id FROM USUARIOS WHERE empresa_id = ? AND id = ?";

    return new Promise<UsuarioDto>((resolve, reject) => {
        db.get<UsuarioDto>(sql, [empresa_id, id], (erro, usuario) => {
            if (erro) {
                return reject(new Error("Buscar Repository Error: " + erro));
            }

            if (!usuario) {
                return reject(
                    new Error("Usuário não localizado.")
                );
            }

            resolve(usuario);
        })
    })
}