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
            return res.status(500).json({
                mensagem: "Erro do servidor: " + error.message
            })
        }

        return res.status(500).json({
            mensagem: "Erro do servidor: "
        })


    }


}