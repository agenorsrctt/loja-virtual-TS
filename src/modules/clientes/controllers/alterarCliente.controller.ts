import type { Request, Response } from "express";
import { alterarClienteService } from "../services/alterarCliente.service.js";

export async function alterarClienteController(req: Request, res: Response) {

    try {

        const empresa_id = res.locals.usuario.empresa_id;
        const id = Number(req.params.id);
        const cliente = req.body;

        await alterarClienteService(cliente, empresa_id, id);

        res.status(200).json({
            mensagem: "Cliente alterado com sucesso!"
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
                erro.message === "Cliente inválido, tente novamente." ||
                erro.message === "Dados do cliente inválidos." ||
                erro.message === "Nome inválido, tente novamente." ||
                erro.message === "E-mail inválido, tente novamente." ||
                erro.message === "Telefone inválido, tente novamente." ||
                erro.message === "Status inválido, tente novamente." ||
                erro.message === "Informe ao menos um campo para alterar."
            ) {
                return res.status(400).json({
                    mensagem: erro.message
                });
            }
        }

        console.error("Erro ao alterar cliente:", erro);

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        });

    }

}
