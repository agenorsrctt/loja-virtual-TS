import type { Request, Response } from "express";
import { buscarUsuarioService } from "../services/buscarUsuario.service.js";

export async function buscarUsuarioController(req: Request, res: Response) {
    
    try {

        const { empresa_id } = req.body;
        const id = Number(req.params.id);

        res.status(200).json({
            mensagem: "Listando usuarios...",
            dados: await buscarUsuarioService(empresa_id, id)
        })
        
    } catch (error) {
        
        if(error instanceof Error) {
            res.status(500).json({
                mensagem:  "Erro no servidor" + error
            });
        }

        res.status(500).json({
            mensagem: "Erro no servidor"
        });


    };


}