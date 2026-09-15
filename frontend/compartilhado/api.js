const CHAVE = 'asr.sessao';

export function sessao() {

    try {

        return JSON.parse(sessionStorage.getItem(CHAVE));

    } catch {

        return null;

    }

}

export function salvarSessao(dados) {

    sessionStorage.setItem(CHAVE, JSON.stringify(dados));

}

export function sair(mensagem = '') {

    sessionStorage.removeItem(CHAVE);

    location.assign('/app/login/login.html' + (mensagem ? '?aviso=' + encodeURIComponent(mensagem) : ''));

}

export async function api(caminho, { method = 'GET', body, publica = false, manterSessao = false } = {}) {

    const headers = { Accept: 'application/json' };

    if (!publica && sessao()?.token) {

        headers.Authorization = 'Bearer ' + sessao().token;

    }

    if (body !== undefined) {

        headers['Content-Type'] = 'application/json';

    }

    let resposta;

    try {

        resposta = await fetch(caminho, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), cache: 'no-store' });

    } catch {

        throw new Error('Não foi possível conectar. Verifique sua conexão e tente novamente.');

    }

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {

        if (resposta.status === 401 && !publica && !manterSessao) {

            sair('Sua sessão expirou. Entre novamente.');

        }

        throw new Error(resposta.status >= 500 ? 'O serviço está indisponível. Tente novamente em instantes.' : dados.mensagem || 'Não foi possível concluir a operação.');

    }

    return dados;

}

export async function protegerPagina({ global = false, primeiro = false } = {}) {

    const atual = sessao();

    if (!atual?.token) {

        location.replace('/app/login/login.html');

        return null;

    }

    if (atual.primeiro_acesso && !primeiro) {

        location.replace('/app/primeiro-acesso/primeiro-acesso.html');

        return null;

    }

    if (primeiro) {

        if (!atual.primeiro_acesso) location.replace('/app/login/login.html');

        return atual.primeiro_acesso ? atual : null;

    }

    if (global !== (atual.escopo === 'superadmin') && location.pathname.indexOf('/perfil/') === -1) {

        location.replace(atual.escopo === 'superadmin' ? '/app/empresas/empresas.html' : '/app/dashboard/dashboard.html');

        return null;

    }

    const resposta = await api(atual.escopo === 'superadmin' ? '/administracao/perfil' : '/usuarios/perfil');

    const nova = { ...atual, perfil: resposta.dados };

    salvarSessao(nova);

    return nova;

}

export function registros(resposta) {

    return resposta.dados ?? resposta.produto ?? [];

}
