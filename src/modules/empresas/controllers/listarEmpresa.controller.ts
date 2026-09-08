import type { Request, Response } from "express";
import { listarEmpresaService } from "../services/listarEmpresa.service.js";

export async function listarEmpresasController(req: Request, res: Response) {

    try {

        res.status(200).json(await listarEmpresaService());

    } catch (error) {

        if (error instanceof Error) {
            return res.status(500).json({
                mensagem: "Erro do servidor",
                error: error.message
            });
        };

        return res.status(500).json({
            mensagem: "Erro do servidor",
        });

    }

}