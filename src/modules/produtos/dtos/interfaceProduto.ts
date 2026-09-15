import type { StatusProdutos } from "./typeProdutos.js";

export interface ProdutosDTO {
    readonly id: number;
    readonly empresa_id: number;
    produto: string;
    estoque: number;
    preco: number;
    categoria: string;
    codigo: string;
    status: StatusProdutos
}

export interface CriarProdutoDTO {
    readonly id: number;
    readonly empresa_id: number;
    produto: string;
    estoque: number;
    preco: number;
    categoria: string;
    codigo: string;
    status: StatusProdutos
}


export interface AlterarProdutoDTO {
    readonly id: number;
    readonly empresa_id: number;
    produto?: string;
    estoque?: number;
    preco?: number;
    categoria?: string;
    codigo?: string;
    status?: StatusProdutos
}