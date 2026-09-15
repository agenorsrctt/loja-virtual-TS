import { buscarSuperAdmin, criarSuperAdmin, buscarLoginEmpresa, concluirPrimeiroAcesso, atualizarSenhaSuperAdmin } from "../repositories/acesso.repository.js";

import type { ContaEmpresa } from "../repositories/acesso.repository.js";

import { ErroAcesso, validarObjeto, validarEmail, validarNovaSenha, emitirToken } from "../utils/acesso.util.js";

import { gerarHashSenha, verificarSenha } from "../../middleware/senha.util.js";

export async function criarSuperAdminService(email: unknown, senha: unknown) {

    validarEmail(email);

    validarNovaSenha(senha);

    if (await buscarSuperAdmin()) {

        throw new ErroAcesso("O superAdmin já foi criado.", 409);

    }

    await criarSuperAdmin(email, await gerarHashSenha(senha));

}

export async function loginSuperAdminService(dados: unknown) {

    validarObjeto(dados);

    const conta = await buscarSuperAdmin();

    if (!conta || dados.email !== conta.email || typeof dados.senha !== "string" || !await verificarSenha(dados.senha, conta.senha)) {

        throw new ErroAcesso("E-mail ou senha inválidos.", 401);

    }

    return emitirToken({ id: 1, escopo: "superadmin", versao_token: conta.versao_token });

}

export async function loginEmpresaService(dados: unknown) {

    validarObjeto(dados);

    if (typeof dados.empresa_id !== "number" || !Number.isSafeInteger(dados.empresa_id) || dados.empresa_id <= 0 || typeof dados.email !== "string" || typeof dados.senha !== "string") {

        throw new ErroAcesso("Empresa, e-mail ou senha inválidos.", 401);

    }

    const conta = await buscarLoginEmpresa(dados.empresa_id, dados.email);

    if (!conta || conta.status !== "ativo" || conta.empresa_status !== "ativo" || !await verificarSenha(dados.senha, conta.senha)) {

        throw new ErroAcesso("Empresa, e-mail ou senha inválidos.", 401);

    }

    const primeiro_acesso = conta.primeiro_acesso === 1;

    const token = emitirToken({ id: conta.id, empresa_id: conta.empresa_id, escopo: "empresa", finalidade: primeiro_acesso ? "primeiro_acesso" : "acesso", versao_token: conta.versao_token }, primeiro_acesso);

    return { token, primeiro_acesso };

}

export async function primeiroAcessoService(conta: ContaEmpresa, dados: unknown) {

    validarObjeto(dados);

    validarEmail(dados.novo_email);

    validarNovaSenha(dados.nova_senha);

    if (dados.novo_email.toLowerCase() === conta.email.toLowerCase() || await verificarSenha(dados.nova_senha, conta.senha)) {

        throw new ErroAcesso("Informe um e-mail e uma senha diferentes dos atuais.", 400);

    }

    const resultado = await concluirPrimeiroAcesso(conta, dados.novo_email, await gerarHashSenha(dados.nova_senha));

    if (resultado.alteracoes !== 1) {

        throw new ErroAcesso("Acesso expirado. Faça login novamente.", 401);

    }

}

export async function alterarSenhaSuperAdminService(versao: number, dados: unknown) {

    validarObjeto(dados);

    validarNovaSenha(dados.nova_senha);

    const conta = await buscarSuperAdmin();

    if (!conta || conta.versao_token !== versao || typeof dados.senha_atual !== "string" || !await verificarSenha(dados.senha_atual, conta.senha)) {

        throw new ErroAcesso("Senha atual ou sessão inválida.", 401);

    }

    if (await verificarSenha(dados.nova_senha, conta.senha)) {

        throw new ErroAcesso("A nova senha deve ser diferente da atual.", 400);

    }

    const resultado = await atualizarSenhaSuperAdmin(versao, await gerarHashSenha(dados.nova_senha));

    if (resultado.alteracoes !== 1) {

        throw new ErroAcesso("Sessão expirada. Faça login novamente.", 401);

    }

}
