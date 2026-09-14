import type { Request, Response } from "express";
import { listarUsuariosService } from "../services/listarUsuario.service.js";
import type { Tipo } from "../dtos/typesUsuario.js";


export async function listarUsuariosController(req: Request, res: Response) {

    try {

        const empresa_id: number = res.locals.usuario.empresa_id;
        const tipo: Tipo = res.locals.usuario.tipo;

        res.status(200).json({
            mensagem: "Listando Usuarios",
            dados: await listarUsuariosService(empresa_id, tipo)
        })

    } catch (error) {

        if(error instanceof Error){
            return res.status(500).json({
                mensagem: "Erro do servidor" + error.message
            });
        }

        res.status(500).json({
            mensagem: "Erro no servidor"
        })
    }

}