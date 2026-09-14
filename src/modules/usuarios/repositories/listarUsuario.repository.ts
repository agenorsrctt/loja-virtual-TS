import db from "../../../database/connection.js";
import type { UsuarioDto } from "../dtos/interfacesUsuario.js";

export function listarUsuarioRepository(empresa_id: number): Promise<UsuarioDto[]>{

    const sql = "SELECT nome, email, tipo, status, empresa_id FROM USUARIOS WHERE empresa_id = ?";

    return new Promise<UsuarioDto[]>((resolve, reject) => {
        db.all<UsuarioDto>(sql, empresa_id, (erro, usuarios) => {
            if(erro){
                return reject(new Error("Listar Repository Error: "+ erro));
            }

            resolve(usuarios);
        })
    })

}