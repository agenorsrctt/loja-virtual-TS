import { inativarProdutoRepository } from "../repositories/inativarProduto.repository.js";

export async function inativarProdutoService(empresa_id: number, id: number) {
    if (!Number.isInteger(empresa_id) || empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Produto inválido, tente novamente.");
    }

    return await inativarProdutoRepository(empresa_id, id);
}
