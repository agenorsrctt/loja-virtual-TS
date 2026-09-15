import type { StatusEmpresa } from "./empresa.dto.js";

export interface AlterarEmpresaDTO {
    empresa?: string;
    cnpj?: string;
    status?: StatusEmpresa;
}
