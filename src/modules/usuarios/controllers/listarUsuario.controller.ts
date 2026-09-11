import type { Request, Response } from "express";
import { listarUsuariosService } from "../services/listarUsuario.service.js";


export async function listarUsuariosController(req: Request, res: Response) {

    try {

        const {empresa_id} = req.body;

        await listarUsuariosService(empresa_id);

        res.status(200).json({
            mensagem: "Listando Usuarios"
        })

    } catch (error) {

        if(error instanceof Error){
            res.status(500).json({
                mensagem: "Erro do servidor" + error.message
            });
        }

        res.status(500).json({
            mensagem: "Erro no servidor"
        })
    }

}