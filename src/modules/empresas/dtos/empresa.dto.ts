export type Status = "ativo" | "inativo";

export interface Empresa {
    id: number;
    empresa: string;
    cnpj: string;
}