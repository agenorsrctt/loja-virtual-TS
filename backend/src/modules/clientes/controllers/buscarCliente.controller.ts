import type { Request, Response } from "express";

import { buscarClienteService } from "../services/buscarCliente.service.js";



export async function buscarClienteController(req: Request, res: Response) {

    try {

        const empresa_id = res.locals.usuario.empresa_id;

        const id = Number(req.params.id);

        const cliente = await buscarClienteService(empresa_id, id);

        res.status(200).json({
            mensagem: "Cliente encontrado com sucesso.",
            dados: cliente
        })

    } catch (erro) {

        if (erro instanceof Error) {
            if (erro.message === "Cliente não encontrado.") {
                return res.status(404).json({
                    mensagem: "Cliente não encontrado."
                });

            }

            if (
                erro.message === "Empresa inválida, tente novamente." ||
                erro.message === "Cliente inválido, tente novamente."
            ) {
                return res.status(400).json({
                    mensagem: erro.message
                });

            }

        }

        console.error("Erro ao buscar cliente:", erro);

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        });

    }

}
