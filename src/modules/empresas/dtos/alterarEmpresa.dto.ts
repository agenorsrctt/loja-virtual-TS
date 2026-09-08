export type Status = "ativo" | "inativo";

export interface alterarEmpresaDTO {
    empresa?: string;
    cnpj?: string;
    status?: Status;
};