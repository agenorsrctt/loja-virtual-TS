import type { Request, Response } from "express";
import { alterarUsuarioService } from "../services/alterarUsuario.service.js";
import type { AlterarUsuarioDto, UsuarioDto } from "../dtos/interfacesUsuario.js";
import { buscarUsuarioService } from "../services/buscarUsuario.service.js";

export async function alterarUsuarioController(req: Request, res: Response) {

    try {

        const alterarUsuario: AlterarUsuarioDto = req.body;

        await alterarUsuarioService(alterarUsuario, alterarUsuario.empresa_id, alterarUsuario.id);

        const usuarioAlterado: UsuarioDto = await buscarUsuarioService(alterarUsuario.empresa_id, alterarUsuario.id)

        res.status(200).json({
            mensagem: "Usuário alterado com sucesso!",
            dados: usuarioAlterado
        })

    } catch (error) {

        if (error instanceof Error) {
            res.status(500).json({
                mensagem: "Erro do servidor" + error.message
            })
        }

        res.status(500).json({
            mensagem: "Erro do servidor"
        })
    }

}