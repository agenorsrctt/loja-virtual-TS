import type { Request, Response } from "express";
import { inativarClienteService } from "../services/inativarCliente.service.js";


export async function inativarClienteController(req: Request, res: Response) {

    try {

        const empresa_id = res.locals.usuario.empresa_id;
        const id = Number(req.params.id);

        await inativarClienteService(empresa_id, id);

        res.status(200).json({
            mensagem: "Cliente inativado do sistema."
        })


    } catch (error) {

        if (error instanceof Error) {
            return res.status(500).json({
                mensagem: "Erro do servidor: " + error.message
            })
        }

        res.status(500).json({
            mensagem: "Erro do servidor: " 
        })


    }

}