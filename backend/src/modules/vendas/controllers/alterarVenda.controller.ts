import type { Request, Response } from "express";

import { alterarVendaService } from "../services/alterarVenda.service.js";

import { tratarErroVenda } from "./tratarErroVenda.controller.js";

export async function alterarVendaController(req: Request, res: Response) {

    try {

        const dados = await alterarVendaService(req.body, res.locals.usuario.empresa_id, res.locals.usuario.id, Number(req.params.id));

        return res.status(200).json({ mensagem: "Venda alterada com sucesso.", dados });

    } catch (erro) {

        return tratarErroVenda(erro, res);

    }

}
