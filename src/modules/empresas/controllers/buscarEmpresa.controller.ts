import type { Response, Request } from "express";
import type { Empresa } from "../dtos/empresa.dto.js";
import { buscarEmpresaService } from "../services/buscarEmpresa.service.js";

export async function buscarEmpresaController(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        const empresaEncontrada: Empresa = await buscarEmpresaService(id);


        res.status(200).json({
            mensagem: "Empresa encontrada.",
            dados: empresaEncontrada
        })

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