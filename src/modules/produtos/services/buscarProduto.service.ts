import { buscarProdutoRepository } from "../repositories/buscarProduto.repository.js";

export async function buscarProdutoService(empresa_id: number, id: number) {
    if (!Number.isInteger(empresa_id) || empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Produto inválido, tente novamente.");
    }

    const produto = await buscarProdutoRepository(empresa_id, id);
    if (!produto) {
        throw new Error("Produto não encontrado.");
    }
    return produto;
}
