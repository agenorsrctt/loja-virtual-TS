import type { Response, Request } from "express";
import type { criarClienteDTO } from "../dtos/interfacesCliente.dto.js";
import { criarClienteService } from "../services/criarCliente.service.js";

export async function criarClienteController(req: Request, res: Response) {
    try {

        const { empresa_id, nome, email, telefone, status } = req.body;

        const novoCliente: criarClienteDTO = {
            empresa_id, nome, email, telefone, status
        }

        await criarClienteService(novoCliente);

        return res.status(201).json({
            mensagem: "Cliente criado com sucesso!",
            dados: novoCliente
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