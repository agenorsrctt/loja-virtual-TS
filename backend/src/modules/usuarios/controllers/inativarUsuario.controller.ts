import type { Request, Response } from "express";
import { inativarUsuarioService } from "../services/inativarUsuario.repository.js";
import { buscarUsuarioService } from "../services/buscarUsuario.service.js";
import type { Tipo } from "../dtos/typesUsuario.js";

export async function inativarUsuarioController(req: Request, res: Response) {
    
    try {
        
        const id: number = Number(req.params.id);

        const empresa_id: number = res.locals.usuario.empresa_id;
        const tipo: Tipo = res.locals.usuario.tipo;

        await inativarUsuarioService(empresa_id, id, tipo);

        res.status(200).json({
            mensagem: "Usuario inativado do sistema.",
            dados: await buscarUsuarioService(empresa_id, id, tipo)
        });

    } catch (error) {
        
        if(error instanceof Error) {
            return res.status(500).json({
                mensagem: "Erro do servidor" + error.message
            })
        };

        res.status(500).json({
            mensagem: "Erro do servidor"
        });

    }

}