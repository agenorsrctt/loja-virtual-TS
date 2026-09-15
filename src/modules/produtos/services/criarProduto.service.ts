import type { CriarProdutoDTO } from "../dtos/interfaceProduto.js";
import { criarProdutoRepository } from "../repositories/criarProduto.repository.js";

export async function criarProdutoService(dados: CriarProdutoDTO, empresa_id: number) {
    if (!Number.isInteger(empresa_id) || empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw new Error("Dados do produto inválidos.");
    }

    if (typeof dados.produto !== "string" || !dados.produto.trim()) {
        throw new Error("Nome do produto inválido.");
    }

    if (typeof dados.categoria !== "string" || !dados.categoria.trim()) {
        throw new Error("Categoria inválida.");
    }

    if (typeof dados.codigo !== "string" || !dados.codigo.trim()) {
        throw new Error("Código inválido.");
    }

    if (typeof dados.preco !== "number" || !Number.isFinite(dados.preco) || dados.preco <= 0) {
        throw new Error("Preço inválido, tente novamente.");
    }

    if (typeof dados.estoque !== "number" || !Number.isInteger(dados.estoque) || dados.estoque < 0) {
        throw new Error("Estoque inválido, tente novamente.");
    }

    if (dados.status !== "ativo" && dados.status !== "inativo") {
        throw new Error("Status inválido, tente novamente.");
    }

    return await criarProdutoRepository(dados, empresa_id);
}
