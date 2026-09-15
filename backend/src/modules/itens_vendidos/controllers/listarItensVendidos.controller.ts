import type { Request, Response } from "express";

import { listarItensVendidosService } from "../services/listarItensVendidos.service.js";

import { tratarErroVenda } from "../../vendas/controllers/tratarErroVenda.controller.js";

export async function listarItensVendidosController(req: Request, res: Response) {

    try {

        const venda_id = req.query.venda_id === undefined ? undefined : Number(req.query.venda_id);

        const dados = await listarItensVendidosService(res.locals.usuario.empresa_id, venda_id);

        return res.status(200).json({ mensagem: "Itens vendidos listados.", dados });

    } catch (erro) {

        return tratarErroVenda(erro, res);

    }

}
