import type { CriarItemVendidoDTO, ItemVendidoDTO } from "../../itens_vendidos/dtos/itemVendido.dto.js";

export type StatusVenda = "pendente" | "cancelado" | "pago";

export interface CriarVendaDTO {
    entrada?: number;
    parcelamento?: { quantidade: number; primeiro_vencimento: string };

    comentarios?: string;
    cliente_id: number;

    itens: CriarItemVendidoDTO[];

}

export interface AlterarVendaDTO {
    comentarios?: string;

    cliente_id?: number;

    itens?: CriarItemVendidoDTO[];

}

export interface VendaDTO {

    readonly id: number;

    readonly empresa_id: number;

    readonly usuario_id: number;

    comentarios?: string;
    cliente_id: number;

    readonly data: string;

    valor_total: number;

    status: StatusVenda;

}

export interface VendaDetalhadaDTO extends VendaDTO {

    valor_pago: number;
    saldo: number;
    pagamentos: {id: number; valor: number; data: string}[];
    parcelas: {id: number; numero: number; valor: number; vencimento: string; valor_pago: number; saldo: number}[];
    itens: ItemVendidoDTO[];

}
