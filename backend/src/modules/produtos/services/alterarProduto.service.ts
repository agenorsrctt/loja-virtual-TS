import type { AlterarProdutoDTO } from "../dtos/interfaceProduto.js";
import { alterarProdutoRepository } from "../repositories/alterarProduto.repository.js";

export async function alterarProdutoService(dados: AlterarProdutoDTO, empresa_id: number, id: number) {
    if (!Number.isInteger(empresa_id) || empresa_id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Produto inválido, tente novamente.");
    }

    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw new Error("Dados do produto inválidos.");
    }

    if (
        dados.produto === undefined &&
        dados.categoria === undefined &&
        dados.codigo === undefined &&
        dados.preco === undefined &&
        dados.estoque === undefined &&
        dados.status === undefined
    ) {
        throw new Error("Informe ao menos um campo para alterar.");
    }

    if (dados.produto !== undefined) {
        if (typeof dados.produto !== "string" || !dados.produto.trim()) {
            throw new Error("Nome do produto inválido.");
        }
    }

    if (dados.categoria !== undefined) {
        if (typeof dados.categoria !== "string" || !dados.categoria.trim()) {
            throw new Error("Categoria inválida.");
        }
    }

    if (dados.codigo !== undefined) {
        if (typeof dados.codigo !== "string" || !dados.codigo.trim()) {
            throw new Error("Código inválido.");
        }
    }

    if (dados.preco !== undefined) {
        if (typeof dados.preco !== "number" || !Number.isFinite(dados.preco) || dados.preco <= 0) {
            throw new Error("Preço inválido, tente novamente.");
        }
    }

    if (dados.estoque !== undefined) {
        if (typeof dados.estoque !== "number" || !Number.isInteger(dados.estoque) || dados.estoque < 0) {
            throw new Error("Estoque inválido, tente novamente.");
        }
    }

    if (dados.status !== undefined) {
        if (dados.status !== "ativo" && dados.status !== "inativo") {
            throw new Error("Status inválido, tente novamente.");
        }
    }

    return await alterarProdutoRepository(dados, empresa_id, id);
}
