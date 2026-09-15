import type { Request, Response } from "express";
import { buscarClienteService } from "../services/buscarCliente.service.js";


export async function buscarClienteController(req: Request, res: Response) {

    try {

        const empresa_id = res.locals.usuario.empresa_id;
        const id = Number(req.params.id);

        const cliente = await buscarClienteService(empresa_id, id);

        res.status(200).json({
            mensagem: "Cliente encontrado com sucesso!",
            dados: cliente
        })

    } catch (error) {

        if (error instanceof Error) {
            return res.status(500).json({
                mensagem: "Erro do servidor",
                error: error.message
            });
        }

        return res.status(500).json({
            mensagem: "Erro do servidor",
        });


    }

}