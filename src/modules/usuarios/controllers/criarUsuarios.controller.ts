import type { Request, Response } from "express";
import { criarUsuariosService } from "../services/criarUsuarios.service.js";


export async function criarUsuarioController(req: Request, res:  Response) {
    try {

        const usuarioCriado = await criarUsuariosService(req.body);

        res.status(201).json({
            mensagem: "Usuario criado com sucesso!",
            dados: usuarioCriado
        })

    } catch (error) {
        
        if(error instanceof Error) {
            res.status(500).json({
                mensagem: "Erro do servidor" + error
            })
        }

        res.status(500).json({
            mensagem: "Erro do servidor."
        })

    }
}