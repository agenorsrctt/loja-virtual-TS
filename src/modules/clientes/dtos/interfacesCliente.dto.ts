export type Status = "ativo" | "inativo";

export interface criarClienteDTO {
    empresa_id: number;
    nome: string;
    email?: string;
    telefone: string;
    status: Status;
}

export interface alterarClienteDTO {
    readonly id: number;
    readonly empresa_id: number;
    nome?: string;
    email?: string;
    telefone?: string;
    status?: Status;
}

export interface ClienteDTO {
    readonly id: number;
    readonly empresa_id: number;
    nome: string;
    email: string;
    telefone: string;
    status: Status;
}