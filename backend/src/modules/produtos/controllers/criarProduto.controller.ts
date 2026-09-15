import type { Request, Response } from "express";
import type { CriarProdutoDTO } from "../dtos/interfaceProduto.js";
import { criarProdutoService } from "../services/criarProduto.service.js";



export async function criarProdutoController(req: Request, res: Response) {

    try {

        const empresa_id = res.locals.usuario.empresa_id;

        const produto: CriarProdutoDTO = req.body;

        await criarProdutoService(produto, empresa_id);

        res.status(201).json({
            mensagem: "Produto criado com sucesso!"
        })

    } catch (error) {

        if (error instanceof Error) {
            if (
                error.message === "Empresa inválida, tente novamente." ||
                error.message === "Dados do produto inválidos." ||
                error.message === "Nome do produto inválido." ||
                error.message === "Categoria inválida." ||
                error.message === "Código inválido." ||
                error.message === "Preço inválido, tente novamente." ||
                error.message === "Estoque inválido, tente novamente." ||
                error.message === "Status inválido, tente novamente."
            ) {
                return res.status(400).json({
                    mensagem: error.message
                });
            }
        }

        console.error("Erro ao criar produto:", error);

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        });

    }

}
