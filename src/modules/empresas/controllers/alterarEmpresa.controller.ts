import type { Request, Response } from "express";
import { alterarEmpresaService } from "../services/alterarEmpresa.service.js";

export async function alterarEmpresaController(req: Request, res: Response) {
    try {
        await alterarEmpresaService(req.body, Number(req.params.id));

        return res.status(200).json({
            mensagem: "Empresa alterada com sucesso!"
        });
    } catch (erro) {
        if (erro instanceof Error) {
            if (erro.message === "Empresa não encontrada.") {
                return res.status(404).json({ mensagem: erro.message });
            }

            if (
                erro.message === "Empresa inválida, tente novamente." ||
                erro.message === "Dados da empresa inválidos." ||
                erro.message === "Nome inválido, tente novamente." ||
                erro.message === "CNPJ inválido, tente novamente." ||
                erro.message === "Status inválido, tente novamente." ||
                erro.message === "Informe ao menos um campo para alterar."
            ) {
                return res.status(400).json({ mensagem: erro.message });
            }
        }

        console.error("Erro ao alterar empresa:", erro);
        return res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
}
