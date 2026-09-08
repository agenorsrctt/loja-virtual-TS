import type { Response, Request } from "express";
import { alterarEmpresaService } from "../services/alterarEmpresa.service.js";
import type { alterarEmpresaDTO } from "../dtos/alterarEmpresa.dto.js";
import { buscarEmpresasPorIDRepository } from "../repositories/buscarEmpresa.repository.js";

export async function alterarEmpresaController(req: Request, res: Response) {

    try {

        /* begin */
        
        const id: number = Number(req.params.id);
        const alterarEmpresa: alterarEmpresaDTO = req.body;

        await alterarEmpresaService(alterarEmpresa, id);

        /* commit */

        const empresaAlterada = await buscarEmpresasPorIDRepository(id);

        res.status(200).json({
            mensagem: "Empresa alterada com sucesso!",
            dados: empresaAlterada
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