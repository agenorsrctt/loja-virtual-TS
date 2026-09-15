import { buscarEmpresaRepository } from "../repositories/buscarEmpresa.repository.js";

export async function buscarEmpresaService(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    const empresa = await buscarEmpresaRepository(id);
    if (!empresa) {
        throw new Error("Empresa não encontrada.");
    }
    return empresa;
}
