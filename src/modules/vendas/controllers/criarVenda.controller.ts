import type { Request, Response } from "express";

import { criarVendaService } from "../services/criarVenda.service.js";

import { tratarErroVenda } from "./tratarErroVenda.controller.js";

export async function criarVendaController(req: Request, res: Response) {

    try {

        const dados = await criarVendaService(req.body, res.locals.usuario.empresa_id, res.locals.usuario.id);

        return res.status(201).json({ mensagem: "Venda criada com sucesso.", dados });

    } catch (erro) {

        return tratarErroVenda(erro, res);

    }

}
