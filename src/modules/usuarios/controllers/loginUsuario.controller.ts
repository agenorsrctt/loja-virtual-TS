import { verificarSenha } from "../../middleware/senha.util.js";

import { gerarToken } from "../../middleware/autenticacao.middleware.js";

import { buscarEmailUsuarioService } from "../services/buscarEmailUsuario.repository.js";

import type { Request, Response } from "express";

export async function loginUsuarioController(req: Request, res: Response) {

    try {

        const { empresa_id, email, senha } = req.body;   

        if (!empresa_id || !email || !senha) {
            throw new Error("E-mail ou senha inválidos.");

        };

        const usuario = await buscarEmailUsuarioService(email, empresa_id);

        if (!usuario) {
            throw new Error("E-mail ou senha inválidos.");

        };

        const senhaValida = await verificarSenha(senha, usuario.senha);

        if (!senhaValida) {
            throw new Error("E-mail ou senha inválidos.");

        };

        const usuarioLogin = {
            id: usuario.id,
            empresa_id: usuario.empresa_id,
            email: usuario.email,
            tipo: usuario.tipo
        }

        const token = await gerarToken(usuarioLogin);


        res.status(200).json({
            mensagem: "Login realizado com sucesso!",
            token
        })

    } catch (error) {

        return res.status(401).json({
            mensagem: error instanceof Error
                ? error.message
                : "Erro ao realizar login."
        });

    }

}