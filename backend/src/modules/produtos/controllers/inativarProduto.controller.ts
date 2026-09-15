import type { Request, Response } from "express";
import { inativarProdutoService } from "../services/inativarProduto.service.js";



export async function inativarProdutoController(req: Request, res: Response) {
    
    try {
        
        const empresa_id = res.locals.usuario.empresa_id;
        const id = Number(req.params.id);

        await inativarProdutoService(empresa_id, id);

        res.status(200).json({
            mensagem: "Produto inativado com sucesso"
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
                error.message === "Produto inválido, tente novamente."
            ) {
                return res.status(400).json({
                    mensagem: error.message
                });
            }
        }

        console.error("Erro ao inativar produto:", error);

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        });

    }

}
