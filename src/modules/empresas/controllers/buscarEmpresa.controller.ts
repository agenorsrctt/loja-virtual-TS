import type { Request, Response } from "express";

import { buscarEmpresaService } from "../services/buscarEmpresa.service.js";

export async function buscarEmpresaController(req: Request, res: Response) {

    try {
        const dados = await buscarEmpresaService(Number(req.params.id));

        return res.status(200).json({
            mensagem: "Empresa encontrada com sucesso.",
            dados
        });

    } catch (erro) {
        if (erro instanceof Error) {
            if (erro.message === "Empresa não encontrada.") {
                return res.status(404).json({ mensagem: erro.message });

            }

            if (
                erro.message === "Empresa inválida, tente novamente."
            ) {
                return res.status(400).json({ mensagem: erro.message });

            }

        }

        console.error("Erro ao buscar empresa:", erro);

        return res.status(500).json({ mensagem: "Erro interno do servidor." });

    }

}
