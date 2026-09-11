import type { Request, Response } from "express";
import { buscarUsuarioService } from "../services/buscarUsuario.service.js";
import type { UsuarioDto } from "../dtos/interfacesUsuario.js";


export async function buscarUsuarioController(req: Request, res: Response) {
    
    try {

        const {empresa_id, id} = req.body;

        await buscarUsuarioService(empresa_id, id);

        res.status(200).json({
            mensagem: "Listando usuarios..."
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