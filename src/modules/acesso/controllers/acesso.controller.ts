import type { Request, Response } from "express";

import { loginSuperAdminService, loginEmpresaService, primeiroAcessoService, alterarSenhaSuperAdminService } from "../services/acesso.service.js";

import { ErroAcesso } from "../utils/acesso.util.js";

export function tratarErroAcesso(erro: unknown, res: Response) {

    if (erro instanceof ErroAcesso) {

        return res.status(erro.status).json({ mensagem: erro.message });

    }

    if (erro && typeof erro === "object" && "code" in erro && erro.code === "SQLITE_CONSTRAINT") {

        return res.status(409).json({ mensagem: "Cadastro já existente ou dados em conflito." });

    }

    console.error("Erro no acesso:", erro);

    return res.status(500).json({ mensagem: "Erro interno do servidor." });

}

export async function loginSuperAdminController(req: Request, res: Response) {

    try {

        return res.json({ token: await loginSuperAdminService(req.body) });

    } catch (erro) {

        return tratarErroAcesso(erro, res);

    }

}

export async function loginEmpresaController(req: Request, res: Response) {

    try {

        return res.json(await loginEmpresaService(req.body));

    } catch (erro) {

        return tratarErroAcesso(erro, res);

    }

}

export async function primeiroAcessoController(req: Request, res: Response) {

    try {

        await primeiroAcessoService(res.locals.conta, req.body);

        return res.json({ mensagem: "E-mail e senha alterados. Faça login novamente." });

    } catch (erro) {

        return tratarErroAcesso(erro, res);

    }

}

export async function alterarSenhaSuperAdminController(req: Request, res: Response) {

    try {

        await alterarSenhaSuperAdminService(res.locals.superadmin.versao_token, req.body);

        return res.json({ mensagem: "Senha alterada. Faça login novamente." });

    } catch (erro) {

        return tratarErroAcesso(erro, res);

    }

}
