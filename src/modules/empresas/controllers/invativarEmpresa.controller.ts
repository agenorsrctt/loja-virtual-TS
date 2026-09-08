import type { Request, Response } from "express";
import { inativarEmpresaService } from "../services/invativarEmpresa.service.js";



export async function invativarEmpresaController(req: Request, res: Response) {
    try {
        /* begin */
        const id = Number(req.params.id);

        const empresaInativada = await inativarEmpresaService(id);

        /* commit */

        res.status(200).json({
            mensagem: "Empresa inativada com sucesso!",
            dados: empresaInativada
        })


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