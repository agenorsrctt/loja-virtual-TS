import type { Empresa } from "../dtos/empresa.dto.js";
import { buscarEmpresasPorIDRepository } from "../repositories/buscarEmpresa.repository.js";

export async function buscarEmpresaService(id: number): Promise<Empresa> {

    if (id <= 0){
        throw new Error("Identificação inválida, tente novamente.");
    }

    return await buscarEmpresasPorIDRepository(id);
}