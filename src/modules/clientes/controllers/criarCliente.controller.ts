import type { Request, Response } from "express";

import type { CriarClienteDTO } from "../dtos/cliente.dto.js";

import { criarClienteService } from "../services/criarCliente.service.js";



export async function criarClienteController(req: Request, res: Response) {

    try {

        const empresa_id = res.locals.usuario.empresa_id;

        const cliente: CriarClienteDTO = req.body;

        await criarClienteService(cliente, empresa_id);

        res.status(201).json({
            mensagem: "Cliente criado com sucesso!"
        })

    } catch (erro) {

        if (erro instanceof Error) {
            if (
                erro.message === "Empresa inválida, tente novamente." ||
                erro.message === "Dados do cliente inválidos." ||
                erro.message === "Nome inválido, tente novamente." ||
                erro.message === "E-mail inválido, tente novamente." ||
                erro.message === "Telefone inválido, tente novamente." ||
                erro.message === "Status inválido, tente novamente."
            ) {
                return res.status(400).json({
                    mensagem: erro.message
                });

            }

        }

        console.error("Erro ao criar cliente:", erro);

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        });

    }

}
