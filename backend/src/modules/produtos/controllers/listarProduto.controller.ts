import type { Request, Response } from "express";
import { listarProdutoService } from "../services/listarProduto.service.js";


export async function listarProdutoController(req: Request, res: Response) {

    try {

        const empresa_id = res.locals.usuario.empresa_id;

        const produtos = await listarProdutoService(empresa_id);

        res.status(200).json({
            mensagem: "Produto encontrado com sucesso.",
            produto: produtos
        })

    } catch (error) {

        if (error instanceof Error) {
            if (
                error.message === "Empresa inválida, tente novamente."
            ) {
                return res.status(400).json({
                    mensagem: error.message
                });
            }
        }

        console.error("Erro ao listar produto:", error);

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        });

    }

}
