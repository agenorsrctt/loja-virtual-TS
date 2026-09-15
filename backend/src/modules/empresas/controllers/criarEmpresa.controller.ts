import type { Request, Response } from "express";

import { criarEmpresaService } from "../services/criarEmpresa.service.js";

import { tratarErroAcesso } from "../../acesso/controllers/acesso.controller.js";

export async function criarEmpresaController(req: Request, res: Response) {

    try {

        const dados = await criarEmpresaService(req.body);

        res.setHeader("Cache-Control", "no-store");

        return res.status(201).json({ mensagem: "Empresa e administrador criados. Guarde as credenciais temporárias.", dados });

    } catch (erro) {

        return tratarErroAcesso(erro, res);

    }

}
