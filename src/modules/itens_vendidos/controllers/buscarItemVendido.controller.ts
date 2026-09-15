import type { Request, Response } from "express";

import { buscarItemVendidoService } from "../services/buscarItemVendido.service.js";

import { tratarErroVenda } from "../../vendas/controllers/tratarErroVenda.controller.js";

export async function buscarItemVendidoController(req: Request, res: Response) {

    try {

        const dados = await buscarItemVendidoService(res.locals.usuario.empresa_id, Number(req.params.id));

        return res.status(200).json({ mensagem: "Item vendido encontrado.", dados });

    } catch (erro) {

        return tratarErroVenda(erro, res);

    }

}
