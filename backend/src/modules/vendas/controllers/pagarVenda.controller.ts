import type { Request, Response } from "express";

import { pagarVendaService } from "../services/pagarVenda.service.js";

import { tratarErroVenda } from "./tratarErroVenda.controller.js";

export async function pagarVendaController(req: Request, res: Response) {

    try {

        const dados = await pagarVendaService(res.locals.usuario.empresa_id, Number(req.params.id), req.body ?? {});

        return res.status(200).json({ mensagem: "Pagamento registrado com sucesso.", dados });

    } catch (erro) {

        return tratarErroVenda(erro, res);

    }

}
