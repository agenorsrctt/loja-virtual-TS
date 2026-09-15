import jwt from "jsonwebtoken";

import type { TokenUsuarioDto } from "../usuarios/dtos/interfacesUsuario.js";

import type { NextFunction, Request, Response } from "express";

function usuarioValido(dados: unknown): dados is TokenUsuarioDto {

    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        return false;

    }

    const usuario = dados as Record<string, unknown>;

    return (
        typeof usuario.id === "number" && Number.isInteger(usuario.id) && usuario.id > 0 &&
        typeof usuario.empresa_id === "number" && Number.isInteger(usuario.empresa_id) && usuario.empresa_id > 0 &&
        typeof usuario.email === "string" && !!usuario.email.trim() && usuario.email.includes("@") &&
        (usuario.tipo === "admin" || usuario.tipo === "gerente" || usuario.tipo === "colaborador")
    );

}

function obterSegredoToken(): string {

    const segredo = process.env.JWT_SECRET;

    if (!segredo || !segredo.trim()) {
        throw new Error("JWT_SECRET não configurado.");

    }

    return segredo;

}

export function gerarToken(usuario: TokenUsuarioDto): string {

    const segredo = obterSegredoToken();

    if (!usuarioValido(usuario)) {
        throw new Error("Dados do usuário inválidos.");

    }

    return jwt.sign(
        { id: usuario.id, empresa_id: usuario.empresa_id, email: usuario.email, tipo: usuario.tipo },
        segredo,
        { algorithm: "HS256", expiresIn: "1h" }
    );

}

export function autenticar(req: Request, res: Response, proximo: NextFunction) {

    const autorizacao = req.headers.authorization;

    const credenciais = typeof autorizacao === "string"
        ? /^Bearer +([^\s]+)$/i.exec(autorizacao)
        : null;

    const token = credenciais?.[1];

    if (!token) {
        return res.status(401).json({ mensagem: "Token inválido." });

    }

    try {
        const usuario = jwt.verify(token, obterSegredoToken(), { algorithms: ["HS256"] });

        if (!usuarioValido(usuario)) {
            return res.status(401).json({ mensagem: "Token inválido." });

        }

        res.locals.usuario = {
            id: usuario.id,
            empresa_id: usuario.empresa_id,
            email: usuario.email,
            tipo: usuario.tipo
        };

    } catch (erro) {
        if (erro instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ mensagem: "Token inválido ou expirado." });

        }

        console.error("Erro ao autenticar usuário:", erro);

        return res.status(500).json({ mensagem: "Erro interno do servidor." });

    }

    return proximo();

}
