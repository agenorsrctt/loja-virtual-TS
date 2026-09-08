import type { Empresa } from "../dtos/empresa.dto.js";
import { inativarEmpresaRepository } from "../repositories/inativarEmpresa.repository.js";

export async function inativarEmpresaService(id: number): Promise<void> {

    if (id<=0) {
        throw new Error("ID inválido ou Empresa não localizada.");
    };

    return inativarEmpresaRepository(id);
}