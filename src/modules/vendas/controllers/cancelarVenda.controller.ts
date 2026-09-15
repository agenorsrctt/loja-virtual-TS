import type { Request, Response } from "express";

import { cancelarVendaService } from "../services/cancelarVenda.service.js";

import { tratarErroVenda } from "./tratarErroVenda.controller.js";

export async function cancelarVendaController(req: Request, res: Response) {

    try {

        const dados = await cancelarVendaService(res.locals.usuario.empresa_id, Number(req.params.id));

        return res.status(200).json({ mensagem: "Venda cancelada com sucesso.", dados });

    } catch (erro) {

        return tratarErroVenda(erro, res);

    }

}
