import jwt from "jsonwebtoken";
import type { loginUsuarioDTO, UsuarioDto } from "../usuarios/dtos/interfacesUsuario.js";
import type { NextFunction, Request, Response } from "express";

export function gerarToken(usuario: loginUsuarioDTO): string {

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET não configurado.")
    }

    if (!usuario) {
        throw new Error("Nenhum usuario encontrado.")
    }

    const token = jwt.sign(
        {
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

export function autenticar(req: Request, res: Response, next: NextFunction) {

    const headerAuthorization = req.headers.authorization;

    if (!headerAuthorization) {
        throw new Error("Token inválido, necessario validar o acesso!")
    }

    const dados = headerAuthorization.split(" ");

    const token = dados[1];

    return token;
}