import type { Request, Response } from "express";

import { listarVendasService } from "../services/listarVendas.service.js";

import { tratarErroVenda } from "./tratarErroVenda.controller.js";

export async function listarVendasController(req: Request, res: Response) {

    try {

        const dados = await listarVendasService(res.locals.usuario.empresa_id);

        return res.status(200).json({ mensagem: "Vendas listadas com sucesso.", dados });

    } catch (erro) {

        return tratarErroVenda(erro, res);

    }

}
