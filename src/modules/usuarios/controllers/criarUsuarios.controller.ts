import type { Request, Response } from "express";
import { criarUsuariosService } from "../services/criarUsuarios.service.js";
import type { Tipo } from "../dtos/typesUsuario.js";


export async function criarUsuarioController(req: Request, res: Response) {
    try {

        const empresa_id: number = res.locals.usuario.empresa_id;
        const tipo: Tipo = res.locals.usuario.tipo;

        await criarUsuariosService(req.body, tipo, empresa_id);

        res.status(201).json({
            mensagem: "Usuario criado com sucesso!",
        })

    } catch (error) {

        if (error instanceof Error) {
            return res.status(500).json({
                mensagem: "Erro do servidor" + error
            })
        }

        res.status(500).json({
            mensagem: "Erro do servidor."
        })

    }
}