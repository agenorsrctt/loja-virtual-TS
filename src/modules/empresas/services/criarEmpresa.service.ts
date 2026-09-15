import { criarEmpresaRepository } from "../repositories/criarEmpresa.repository.js";

import type { CriarEmpresaDTO } from "../dtos/criarEmpresa.dto.js";

import type { EmpresaDTO } from "../dtos/empresa.dto.js";

import type { CriarUsuarioDto } from "../../usuarios/dtos/interfacesUsuario.js";

import { criarUsuariosService } from "../../usuarios/services/criarUsuarios.service.js";

import { begin, commit, rollback } from "../../../database/transaction.js";

export async function criarEmpresaService(dados: CriarEmpresaDTO): Promise<EmpresaDTO> {

    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw new Error("Dados da empresa inválidos.");

    }

    if (typeof dados.empresa !== "string" || !dados.empresa.trim()) {
        throw new Error("Nome inválido, tente novamente.");

    }

    if (typeof dados.cnpj !== "string" || !dados.cnpj.trim()) {
        throw new Error("CNPJ inválido, tente novamente.");

    }

    await begin();

    try {
        const empresa = await criarEmpresaRepository(dados);

        const administrador: CriarUsuarioDto = {
            empresa_id: empresa.id,
            nome: "Admin",
            tipo: "admin",
            email: "mudar@email.com",
            senha: "123456"
        };

        await criarUsuariosService(administrador, "admin", empresa.id);

        await commit();

        return empresa;

    } catch (erro) {
        await rollback();

        throw erro;

    }

}
