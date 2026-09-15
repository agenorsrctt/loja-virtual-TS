import type { Request, Response } from "express";
import { listarClienteService } from "../services/listarCliente.service.js";


export async function listarClienteController(req: Request, res: Response) {

    try {

        const empresa_id = res.locals.usuario.empresa_id;

        const clientes = await listarClienteService(empresa_id);

        res.status(200).json({
            mensagem: "Listando clientes",
            dados: clientes
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