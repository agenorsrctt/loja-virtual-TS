import jwt from "jsonwebtoken";
import type { TokenUsuarioDto } from "../usuarios/dtos/interfacesUsuario.js";
import type { NextFunction, Request, Response } from "express";

export function gerarToken(usuario: TokenUsuarioDto): string {

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

    try {
        const headerAuthorization = req.headers.authorization;

        if (!headerAuthorization) {
            throw new Error("Token inválido, necessario validar o acesso!")
        }

        const dados = headerAuthorization.split(" ");

        const tipoToken = dados[0];
        const token = dados[1];

        if (tipoToken !== "Bearer" || !token) {
            return res.status(401).json({
                mensagem: "Token inválido."
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET não configurado.");
        }

        const usuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        res.locals.usuario = usuario;

        next();
    } catch (error) {

        return res.status(401).json({
            mensagem: "Token inválido ou expirado."
        });

    }
}