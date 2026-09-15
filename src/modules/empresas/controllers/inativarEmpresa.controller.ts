import type { Request, Response } from "express";

import { inativarEmpresaService } from "../services/inativarEmpresa.service.js";

export async function inativarEmpresaController(req: Request, res: Response) {

    try {
        await inativarEmpresaService(Number(req.params.id));

        return res.status(200).json({
            mensagem: "Empresa inativada com sucesso!"
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

        console.error("Erro ao inativar empresa:", erro);

        return res.status(500).json({ mensagem: "Erro interno do servidor." });

    }

}
