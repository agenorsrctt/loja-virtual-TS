export type StatusCliente = "ativo" | "inativo";

export interface CriarClienteDTO {
    nome: string;

    email?: string;

    telefone: string;

    status: StatusCliente;

}

export interface AlterarClienteDTO {
    nome?: string;

    email?: string;

    telefone?: string;

    status?: StatusCliente;

}

export interface ClienteDTO {
    readonly id: number;

    readonly empresa_id: number;

    nome: string;

    email: string | null;

    telefone: string;

    status: StatusCliente;

}