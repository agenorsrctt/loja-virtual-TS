import type { Request, Response } from "express";

import { criarEmpresaService } from "../services/criarEmpresa.service.js";

export async function criarEmpresaController(req: Request, res: Response) {

    try {
        await criarEmpresaService(req.body);

        return res.status(201).json({
            mensagem: "Empresa criada com sucesso!"
        });

    } catch (erro) {
        if (erro instanceof Error) {
            if (
                erro.message === "Dados da empresa inválidos." ||
                erro.message === "Nome inválido, tente novamente." ||
                erro.message === "CNPJ inválido, tente novamente."
            ) {
                return res.status(400).json({ mensagem: erro.message });

            }

        }

        console.error("Erro ao criar empresa:", erro);

        return res.status(500).json({ mensagem: "Erro interno do servidor." });

    }

}
