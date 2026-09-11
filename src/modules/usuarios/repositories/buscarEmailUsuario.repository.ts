import { type UsuarioDto } from "../dtos/interfacesUsuario.js";
import db from "../../../database/connection.js";


export function buscarEmailUsuarioRepository(email: string): Promise<UsuarioDto | undefined>{

    const sql = "SELECT * FROM USUARIOS WHERE email = ?";

    return new Promise<UsuarioDto>((resolve, reject) => {
        db.get<UsuarioDto>(sql, email, (erro, usuario) => {
            if(erro) {
                return reject(new Error("Erro do banco: " + erro));
            };

            resolve(usuario);
        });
    });
};