import type { Request, Response } from "express";

import { alterarSenhaEmpresaService } from "../services/acesso.service.js";

import { tratarErroAcesso } from "./acesso.controller.js";

export function perfilEmpresaController(_req: Request, res: Response) {

    res.setHeader("Cache-Control", "no-store");

    return res.json({ dados: res.locals.usuario });

}

export function perfilSuperAdminController(_req: Request, res: Response) {

    res.setHeader("Cache-Control", "no-store");

    return res.json({ dados: { id: 1, nome: "SuperAdmin", email: res.locals.superadmin.email, tipo: "superadmin" } });

}

export async function alterarSenhaEmpresaController(req: Request, res: Response) {

    try {

        await alterarSenhaEmpresaService(res.locals.usuario.empresa_id, res.locals.usuario.id, req.body);

        return res.json({ mensagem: "Senha alterada. Faça login novamente." });

    } catch (erro) {

        return tratarErroAcesso(erro, res);

    }

}
