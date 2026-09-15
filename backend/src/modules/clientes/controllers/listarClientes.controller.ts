import type { Request, Response } from "express";

import { listarClientesService } from "../services/listarClientes.service.js";


export async function listarClientesController(req: Request, res: Response) {

    try {

        const empresa_id = res.locals.usuario.empresa_id;

        const clientes = await listarClientesService(empresa_id);

        res.status(200).json({
            mensagem: "Cliente encontrado com sucesso.",
            dados: clientes
        })

    } catch (erro) {

        if (erro instanceof Error) {
            if (
                erro.message === "Empresa inválida, tente novamente."
            ) {
                return res.status(400).json({
                    mensagem: erro.message
                });

            }

        }

        console.error("Erro ao listar cliente:", erro);

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        });

    }

}
