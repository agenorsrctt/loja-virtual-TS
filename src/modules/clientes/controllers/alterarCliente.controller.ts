import type { Request, Response } from "express";
import type { alterarClienteDTO } from "../dtos/interfacesCliente.dto.js";
import { alterarClienteService } from "../services/alterarCliente.service.js";


export async function alterarClienteController(req: Request, res: Response) {

    try {

        const dados: alterarClienteDTO = req.body;
        const empresa_id = res.locals.usuario.empresa_id;
        const id = Number(req.params.id);

        await alterarClienteService(dados, empresa_id, id);

        res.status(200).json({
            mensagem: "Cliente alterado com sucesso.",
            dados: dados
        })

    } catch (error) {

        if (error instanceof Error) {
            return res.status(500).json({
                mensagem: "Erro do servidor: " + error
            })
        }

        return res.status(500).json({
            mensagem: "Erro do servidor: "
        })

    }

}