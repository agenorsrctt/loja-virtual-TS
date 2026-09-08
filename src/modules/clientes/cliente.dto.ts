export type Status = "ativo" | "inativo";

export interface criarClienteDTO {
    empresa_id: number;
    nome: string;
    email?: string;
    telefone: string;
    status: Status;
}