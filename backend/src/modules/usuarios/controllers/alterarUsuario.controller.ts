import type { Request, Response } from "express";
import { alterarUsuarioService } from "../services/alterarUsuario.service.js";
import type { AlterarUsuarioDto, UsuarioDto } from "../dtos/interfacesUsuario.js";
import { buscarUsuarioService } from "../services/buscarUsuario.service.js";
import type { Tipo } from "../dtos/typesUsuario.js";

export async function alterarUsuarioController(req: Request, res: Response) {

    try {

        const alterarUsuario: AlterarUsuarioDto = req.body;
        const empresa_id =  res.locals.usuario.empresa_id;
        const tipo: Tipo = res.locals.usuario.tipo;

        await alterarUsuarioService(alterarUsuario, empresa_id, alterarUsuario.id, tipo);

        const usuarioAlterado: UsuarioDto = await buscarUsuarioService(empresa_id, alterarUsuario.id, tipo)

        res.status(200).json({
            mensagem: "Usuário alterado com sucesso!",
            dados: usuarioAlterado
        })

    } catch (error) {

        if (error instanceof Error) {
            return res.status(500).json({
                mensagem: "Erro do servidor" + error.message
            })
        }

        res.status(500).json({
            mensagem: "Erro do servidor"
        })
    }

}