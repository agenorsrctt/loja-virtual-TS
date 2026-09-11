import type { Request, Response } from "express";
import type { loginUsuarioDTO } from "../usuarios/dtos/interfacesUsuario.js";
import { gerarToken } from "./jwt.js";

export async function loginUsuario(req: Request, res: Response) {
    
    try {
        
        const usuario: loginUsuarioDTO = req.body;

        if(!usuario) {
            throw new Error("Usuario não localizado.");
        }

        gerarToken(usuario);

    } catch (error) {

        if(error instanceof Error) {
            throw new Error("Erro: " + error);
        }
        
    }

}