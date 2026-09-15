import type { EmpresaDTO } from "../dtos/empresa.dto.js";
import { listarEmpresasRepository } from "../repositories/listarEmpresas.repository.js";

export async function listarEmpresasService(): Promise<EmpresaDTO[]> {
    return await listarEmpresasRepository();
}
