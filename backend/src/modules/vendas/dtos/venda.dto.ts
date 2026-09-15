import type { CriarItemVendidoDTO, ItemVendidoDTO } from "../../itens_vendidos/dtos/itemVendido.dto.js";

export type StatusVenda = "pendente" | "cancelado" | "pago";

export interface CriarVendaDTO {

    cliente_id: number;

    itens: CriarItemVendidoDTO[];

}

export interface AlterarVendaDTO {

    cliente_id?: number;

    itens?: CriarItemVendidoDTO[];

}

export interface VendaDTO {

    readonly id: number;

    readonly empresa_id: number;

    readonly usuario_id: number;

    cliente_id: number;

    readonly data: string;

    valor_total: number;

    status: StatusVenda;

}

export interface VendaDetalhadaDTO extends VendaDTO {

    itens: ItemVendidoDTO[];

}
