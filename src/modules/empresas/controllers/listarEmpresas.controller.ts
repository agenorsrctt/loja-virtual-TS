import type { Request, Response } from "express";
import { listarEmpresasService } from "../services/listarEmpresas.service.js";

export async function listarEmpresasController(req: Request, res: Response) {
    try {
        const dados = await listarEmpresasService();

        return res.status(200).json({
            mensagem: "Empresas listadas com sucesso.",
            dados
        });
    } catch (erro) {
        console.error("Erro ao listar empresa:", erro);
        return res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
}
