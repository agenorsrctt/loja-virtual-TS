import type { Request, Response } from "express";
import { criarEmpresaService } from "../services/criarEmpresa.service.js";
import type { criarEmpresaDTO } from "../dtos/criarEmpresa.dto.js";
import type { Empresa } from "../dtos/empresa.dto.js";

export async function criarEmpresaController(req: Request, res: Response) {

    try {
        /* begin */

        const novaEmpresa: criarEmpresaDTO = req.body;

        await criarEmpresaService(novaEmpresa);

        /* commit */


        return res.status(201).json({
            mensagem: "Empresa adicionada com sucesso!",
            dados: novaEmpresa
        });

    } catch (error) {

        /* rollback */

        if (error instanceof Error) {
            return res.status(500).json({
                mensagem: "Erro do servidor",
                error: error.message
            });
        };

        return res.status(500).json({
            mensagem: "Erro do servidor",
        });

    };

};