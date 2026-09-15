import jwt from "jsonwebtoken";

export class ErroAcesso extends Error {

    constructor(mensagem: string, public readonly status: number) {

        super(mensagem);

    }

}

export function validarObjeto(dados: unknown): asserts dados is Record<string, unknown> {

    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {

        throw new ErroAcesso("Dados inválidos.", 400);

    }

}

export function validarEmail(email: unknown): asserts email is string {

    if (typeof email !== "string" || email !== email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

        throw new ErroAcesso("E-mail inválido.", 400);

    }

}

export function validarNovaSenha(senha: unknown): asserts senha is string {

    if (typeof senha !== "string" || senha.trim().length < 12 || Buffer.byteLength(senha, "utf8") > 72) {

        throw new ErroAcesso("A senha deve ter ao menos 12 caracteres e no máximo 72 bytes.", 400);

    }

}

export function segredoToken(): string {

    const segredo = process.env.JWT_SECRET;

    if (!segredo?.trim()) {

        throw new Error("JWT_SECRET não configurado.");

    }

    return segredo;

}

export function emitirToken(dados: object, temporario = false): string {

    return jwt.sign(dados, segredoToken(), { algorithm: "HS256", expiresIn: temporario ? "15m" : "1h" });

}
