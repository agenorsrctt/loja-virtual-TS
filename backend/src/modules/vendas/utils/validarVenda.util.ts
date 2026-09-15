import type { CriarItemVendidoDTO } from "../../itens_vendidos/dtos/itemVendido.dto.js";

import { ErroVenda } from "./erroVenda.util.js";

export function validarIdVenda(valor: unknown, campo: string): asserts valor is number {

    if (typeof valor !== "number" || !Number.isSafeInteger(valor) || valor <= 0) {

        throw new ErroVenda(`${campo} inválido.`, 400);

    }

}

export function validarDadosVenda(dados: unknown): asserts dados is Record<string, unknown> {

    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {

        throw new ErroVenda("Dados da venda inválidos.", 400);

    }

}

export function validarItensVenda(itens: unknown): asserts itens is CriarItemVendidoDTO[] {

    if (!Array.isArray(itens) || itens.length === 0) {

        throw new ErroVenda("Informe ao menos um item para a venda.", 400);

    }

    const produtos = new Set<number>();

    for (const item of itens) {

        validarDadosVenda(item);

        validarIdVenda(item.produto_id, "Produto");

        validarIdVenda(item.quantidade, "Quantidade");

        if (produtos.has(item.produto_id)) {

            throw new ErroVenda("Produto repetido: informe a quantidade em um único item.", 400);

        }

        produtos.add(item.produto_id);

    }

}
