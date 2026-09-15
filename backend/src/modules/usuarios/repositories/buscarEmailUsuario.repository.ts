import { type UsuarioDto } from "../dtos/interfacesUsuario.js";

import db from "../../../database/connection.js";


export function buscarEmailUsuarioRepository(email: string, empresa_id: number): Promise<UsuarioDto | undefined>{

    const sql = "SELECT * FROM USUARIOS WHERE email = ? AND empresa_id = ?";

    return new Promise<UsuarioDto>((resolve, reject) => {

        db.get<UsuarioDto>(sql, [email, empresa_id], (erro, usuario) => {

            if(erro) {
                return reject(new Error("Erro do banco: " + erro));

            };

            resolve(usuario);

        });

    });

};