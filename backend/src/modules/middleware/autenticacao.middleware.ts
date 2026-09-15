import jwt from "jsonwebtoken";

import type { Request, Response, NextFunction } from "express";

import { buscarSuperAdmin, buscarContaEmpresa } from "../acesso/repositories/acesso.repository.js";

import { ErroAcesso, segredoToken } from "../acesso/utils/acesso.util.js";

import { tratarErroAcesso } from "../acesso/controllers/acesso.controller.js";

function proteger(escopo: "empresa" | "superadmin", primeiroAcesso = false) {

    return async (req: Request, res: Response, proximo: NextFunction) => {

        try {

            const cabecalho = req.headers.authorization;

            const token = typeof cabecalho === "string" ? /^Bearer +([^\s]+)$/i.exec(cabecalho)?.[1] : undefined;

            if (!token) {

                throw new ErroAcesso("Token inválido.", 401);

            }

            const dados = jwt.verify(token, segredoToken(), { algorithms: ["HS256"] });

            if (typeof dados === "string" || !Number.isSafeInteger(dados.id) || dados.id <= 0 || !Number.isSafeInteger(dados.versao_token) || dados.versao_token < 0 || !Number.isSafeInteger(dados.exp)) {

                throw new ErroAcesso("Token inválido.", 401);

            }

            if (dados.escopo !== escopo) {

                throw new ErroAcesso("Acesso não permitido.", 403);

            }

            if (escopo === "superadmin") {

                const conta = await buscarSuperAdmin();

                if (!conta || dados.id !== 1 || conta.versao_token !== dados.versao_token) {

                    throw new ErroAcesso("Sessão expirada.", 401);

                }

                res.locals.superadmin = { id: 1, versao_token: conta.versao_token };

            } else {

                if (!Number.isSafeInteger(dados.empresa_id) || dados.empresa_id <= 0) {

                    throw new ErroAcesso("Token inválido.", 401);

                }

                const conta = await buscarContaEmpresa(dados.empresa_id, dados.id);

                if (!conta || conta.status !== "ativo" || conta.empresa_status !== "ativo" || conta.versao_token !== dados.versao_token) {

                    throw new ErroAcesso("Sessão expirada ou conta inativa.", 401);

                }

                const finalidade = primeiroAcesso ? "primeiro_acesso" : "acesso";

                if (dados.finalidade !== finalidade || (conta.primeiro_acesso === 1) !== primeiroAcesso) {

                    throw new ErroAcesso("Conclua o primeiro acesso ou faça login novamente.", 403);

                }

                if (!["admin", "gerente", "colaborador"].includes(conta.tipo)) {

                    throw new ErroAcesso("Perfil inválido.", 403);

                }

                res.locals.usuario = { id: conta.id, empresa_id: conta.empresa_id, email: conta.email, tipo: conta.tipo };

                if (primeiroAcesso) {

                    res.locals.conta = conta;

                }

            }

        } catch (erro) {

            if (erro instanceof jwt.JsonWebTokenError) {

                return res.status(401).json({ mensagem: "Token inválido ou expirado." });

            }

            return tratarErroAcesso(erro, res);

        }

        return proximo();

    };

}

export const autenticar = proteger("empresa");

export const autenticarPrimeiroAcesso = proteger("empresa", true);

export const autenticarSuperAdmin = proteger("superadmin");
