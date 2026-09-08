import type { Empresa } from "../dtos/empresa.dto.js";
import { listarEmpresasRepository } from "../repositories/listarEmpresas.repository.js";

export async function listarEmpresaService(): Promise<Empresa[]> {
    
    const empresas: Empresa[] = await listarEmpresasRepository();

    if(empresas.length === 0) {
        throw new Error("Nenhuma empresa cadastrada até o momento.");
    }

    return empresas;
}