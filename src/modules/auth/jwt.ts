import jwt from "jsonwebtoken";
import type { UsuarioDto } from "../usuarios/dtos/interfacesUsuario.js";

export function gerarToken(usuario: UsuarioDto): string {

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET não configurado.")
    }

    if (!usuario) {
        throw new Error("Nenhum usuario encontrado.")
    }

    const token = jwt.sign({
        id: usuario.id,
        empresa_id: usuario.empresa_id,
        email: usuario.email,
        tipo: usuario.tipo
    },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );

    return token;
}