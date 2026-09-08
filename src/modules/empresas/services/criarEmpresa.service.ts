import { criarEmpresaRepository } from "../repositories/criarEmpresa.repository.js"
import type { criarEmpresaDTO } from "../dtos/criarEmpresa.dto.js";
import type { CriarUsuarioDto } from "../../usuarios/dtos/interfacesUsuario.js";
import { criarUsuarioRepository } from "../../usuarios/repositories/criarUsuario.repository.js";
import { begin, commit, rollback } from "../../../database/transaction.js";

export async function criarEmpresaService(dados: criarEmpresaDTO): Promise<void> {

    if (!dados.empresa) {
        throw new Error("Nome inválido, tente novamente.")
    }

    if (!dados.cnpj) {
        throw new Error("CNPJ inválido, tente novamente.")
    }

    await begin();
    try {
        const empresaCriada = await criarEmpresaRepository(dados);

        const empresaAdmin: CriarUsuarioDto = {
            empresa_id: empresaCriada,
            nome: "Admin",
            tipo: "admin",
            email: "mudar@email.com",
            status: "ativo",
            senha: "123456",
            primeiroAcesso: true
        }

        await criarUsuarioRepository(empresaAdmin);

        await commit();

    } catch (error) {

        await rollback();

        if (error instanceof Error) {
            throw new Error("CriarService Error: - " + error.message);
        }

        throw new Error("CriarService Error: - Erro desconhecido.");

    }

};