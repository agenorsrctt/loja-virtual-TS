import type { Request, Response } from "express";

import { buscarVendaService } from "../services/buscarVenda.service.js";

import { tratarErroVenda } from "./tratarErroVenda.controller.js";

export async function buscarVendaController(req: Request, res: Response) {

    try {

        const dados = await buscarVendaService(res.locals.usuario.empresa_id, Number(req.params.id));

        return res.status(200).json({ mensagem: "Venda encontrada com sucesso.", dados });

    } catch (erro) {

        return tratarErroVenda(erro, res);

    }

}
