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

        if (item.produto_id == null) {
            if (typeof item.descricao !== 'string' || !item.descricao.trim() || item.descricao.trim().length > 200) throw new ErroVenda("Informe a descrição do item (até 200 caracteres).", 400);
            validarDinheiro(item.valor_unitario);
            validarIdVenda(item.quantidade, "Quantidade");
            continue;
        }
        validarIdVenda(item.produto_id, "Produto");

        validarIdVenda(item.quantidade, "Quantidade");

        if (produtos.has(item.produto_id)) {

            throw new ErroVenda("Produto repetido: informe a quantidade em um único item.", 400);

        }

        produtos.add(item.produto_id);

    }

}

export function validarDinheiro(valor: unknown, zero = false): asserts valor is number {
    if (typeof valor !== 'number' || !Number.isFinite(valor) || !Number.isSafeInteger(Math.round(valor * 100)) || valor < 0 || (!zero && Math.round(valor * 100) === 0) || Math.abs(valor * 100 - Math.round(valor * 100)) > 0.00001)
        throw new ErroVenda("Informe um valor válido com até duas casas decimais.", 400);
}
export function validarCondicoes(dados: {comentarios?: string; entrada?: number; parcelamento?: {quantidade: number; primeiro_vencimento: string}}) {
    if (dados.comentarios !== undefined && (typeof dados.comentarios !== 'string' || dados.comentarios.length > 2000)) throw new ErroVenda("Comentários devem ter até 2000 caracteres.", 400);
    if (dados.entrada !== undefined) validarDinheiro(dados.entrada, true);
    if (dados.parcelamento !== undefined) {
        const p = dados.parcelamento;
        if (!p || !Number.isInteger(p.quantidade) || p.quantidade < 1 || p.quantidade > 120 || typeof p.primeiro_vencimento !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.primeiro_vencimento) || !Number.isFinite(Date.parse(p.primeiro_vencimento)) || new Date(p.primeiro_vencimento).toISOString().slice(0,10) !== p.primeiro_vencimento)
            throw new ErroVenda("Informe de 1 a 120 parcelas e uma data válida.", 400);
    }
}
