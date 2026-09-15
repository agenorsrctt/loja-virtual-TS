import { inativarEmpresaRepository } from "../repositories/inativarEmpresa.repository.js";

export async function inativarEmpresaService(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Empresa inválida, tente novamente.");
    }

    return await inativarEmpresaRepository(id);
}
