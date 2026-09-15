export interface CriarItemVendidoDTO {

    produto_id: number;

    quantidade: number;

}

export interface ItemVendidoDTO extends CriarItemVendidoDTO {

    readonly id: number;

    readonly venda_id: number;

    readonly empresa_id: number;

    valor_vendido: number;

}
