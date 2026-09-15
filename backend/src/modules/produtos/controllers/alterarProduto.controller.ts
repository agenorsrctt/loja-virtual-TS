import type { Request, Response } from "express";
import { alterarProdutoService } from "../services/alterarProduto.service.js";

export async function alterarProdutoController(req: Request, res: Response) {
    
    try {

        const empresa_id = res.locals.usuario.empresa_id;
        const id = Number(req.params.id);
        const produto = req.body;

        await alterarProdutoService(produto, empresa_id, id);

        res.status(200).json({
            mensagem: "Produto alterado com sucesso!"
        })

        
    } catch (error) {
        
        if (error instanceof Error) {
            if (error.message === "Produto não encontrado.") {
                return res.status(404).json({
                    mensagem: "Produto não encontrado."
                });
            }

            if (
                error.message === "Empresa inválida, tente novamente." ||
                error.message === "Produto inválido, tente novamente." ||
                error.message === "Dados do produto inválidos." ||
                error.message === "Nome do produto inválido." ||
                error.message === "Categoria inválida." ||
                error.message === "Código inválido." ||
                error.message === "Preço inválido, tente novamente." ||
                error.message === "Estoque inválido, tente novamente." ||
                error.message === "Status inválido, tente novamente." ||
                error.message === "Informe ao menos um campo para alterar."
            ) {
                return res.status(400).json({
                    mensagem: error.message
                });
            }
        }

        console.error("Erro ao alterar produto:", error);

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        });

    }

}
