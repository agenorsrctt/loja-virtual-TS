import type { Request, Response } from "express";
import { inativarUsuarioService } from "../services/inativarUsuario.repository.js";
import { buscarUsuarioService } from "../services/buscarUsuario.service.js";

export async function inativarUsuarioController(req: Request, res: Response) {
    
    try {
        
        const id = Number(req.params.id);

        const empresa_id = req.body;

        await inativarUsuarioService(empresa_id, id);

        res.status(200).json({
            mensagem: "Usuario inativado do sistema.",
            dados: await buscarUsuarioService(empresa_id, id)
        });

    } catch (error) {
        
        if(error instanceof Error) {
            res.status(500).json({
                mensagem: "Erro do servidor" + error.message
            })
        };

        res.status(500).json({
            mensagem: "Erro do servidor"
        });

    }

}