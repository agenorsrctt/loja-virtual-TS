import type { ProdutosDTO } from "../dtos/interfaceProduto.js";
import { listarProdutoRepository } from "../repositories/listarProduto.repository.js";

export async function listarProdutoService(empresa_id: number): Promise<ProdutosDTO[]> {
    if (!Number.isInteger(empresa_id) || empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    return await listarProdutoRepository(empresa_id);
}
