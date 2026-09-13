import { compararHash } from "../../middleware/bcrypt.js";
import { gerarToken } from "../../middleware/jwt.js";
import { buscarEmailUsuarioService } from "../services/buscarEmailUsuario.repository.js";
import type { Request, Response } from "express";

export async function loginUsuarioController(req: Request, res: Response) {
    try {

        const { email, senha } = req.body;

        if (!email || !senha) {
            throw new Error("E-mail ou senha inválidos.");
        };

        const usuario = await buscarEmailUsuarioService(email);

        if (!usuario) {
            throw new Error("E-mail ou senha inválidos.");
        };

        const senhaValida = await compararHash(senha, usuario.senha);

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