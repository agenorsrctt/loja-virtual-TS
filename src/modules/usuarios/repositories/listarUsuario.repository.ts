import db from "../../../database/connection.js";
import type { UsuarioDto } from "../dtos/interfacesUsuario.js";

export function listarUsuarioRepository(): Promise<UsuarioDto[]>{

    const sql = "SELECT * FROM USUARIOS WHERE empresa_id = ?";

    return new Promise<UsuarioDto[]>((resolve, reject) => {
        db.all<UsuarioDto>(sql, (erro, usuarios) => {
            if(erro){
                return reject(new Error("Listar Repository Error: "+ erro));
            }

            resolve(usuarios);
        })
    })

}