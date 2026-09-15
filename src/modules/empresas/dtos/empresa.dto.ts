export type StatusEmpresa = "ativo" | "inativo";

export interface EmpresaDTO {
    readonly id: number;
    empresa: string;
    cnpj: string;
    status: StatusEmpresa;
}
