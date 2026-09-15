import crypto from "node:crypto";

import type { CriarEmpresaDTO } from "../dtos/criarEmpresa.dto.js";

import type { EmpresaDTO } from "../dtos/empresa.dto.js";

import { executarTransacaoVenda, executarSQL } from "../../vendas/repositories/transacaoVenda.repository.js";

import { gerarHashSenha } from "../../middleware/senha.util.js";

import { validarObjeto, ErroAcesso } from "../../acesso/utils/acesso.util.js";

export async function criarEmpresaService(dados: CriarEmpresaDTO) {

    validarObjeto(dados);

    if (typeof dados.empresa !== "string" || !dados.empresa.trim() || typeof dados.cnpj !== "string" || !dados.cnpj.trim()) {

        throw new ErroAcesso("Nome e CNPJ são obrigatórios.", 400);

    }

    const senhaTemporaria = crypto.randomBytes(18).toString("base64url");

    const email = "admin-" + crypto.randomBytes(12).toString("hex") + "@primeiro-acesso.invalid";

    const hash = await gerarHashSenha(senhaTemporaria);

    return executarTransacaoVenda(async (conexao) => {

        const resultado = await executarSQL(conexao, "INSERT INTO EMPRESAS(empresa, cnpj, status) VALUES(?, ?, 'ativo')", [dados.empresa, dados.cnpj]);

        const usuario = await executarSQL(conexao, "INSERT INTO USUARIOS(empresa_id, nome, tipo, email, senha, status, primeiro_acesso) VALUES(?, 'Admin', 'admin', ?, ?, 'ativo', 1)", [resultado.id, email, hash]);

        const empresa: EmpresaDTO = { id: resultado.id, empresa: dados.empresa, cnpj: dados.cnpj, status: "ativo" };

        return { ...empresa, administrador: { id: usuario.id, email, senha_temporaria: senhaTemporaria, primeiro_acesso: true } };

    });

}
