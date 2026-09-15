import type { CriarProdutoDTO } from "../dtos/interfaceProduto.js";



export async function criarProdutoService(dados: CriarProdutoDTO, empresa_id: number) {
    
    if(dados.id !== undefined && !dados.id) {
        throw new Error("Produto não encontrado.")
    }

    if(dados.empresa_id !== undefined && !dados.empresa_id) {
        throw new Error("Empresa não identificada")
    }

    if(dados.produto !== undefined && !dados.produto.trim()) {
        throw new Error("Produto inválido, tente novamente.")
    }

    if(dados.preco !== undefined){
        if(!dados.preco) {
            throw new Error("Preço inválido, tente novamente.")
        }


        if(dados.preco <= 0) {
            throw new Error("Preço inválido, tente novamente.")
        }

    }

    if(dados.estoque !== undefined) {
        if(!dados.estoque) {
            throw new Error("Estoque inválido, tente novamente.")
        }


        if(dados.estoque <= 0) {
            throw new Error("Estoque inválido, tente novamente.")
        }
    }

    return await criarProdutoRepository(dados, empresa_id);

}