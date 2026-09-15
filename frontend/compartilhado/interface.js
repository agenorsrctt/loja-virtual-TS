import { sessao, sair, protegerPagina } from './api.js';

const caminhos = {
    inicio: '<path d="m3 10 9-7 9 7v10H4V10m5 10v-7h6v7"/>',
    clientes: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2"/>',
    produtos: '<path d="m12 3 9 5v9l-9 5-9-5V8Zm-9 5 9 5 9-5M12 13v9M7 5.8l9 5"/>',
    vendas: '<path d="M2 3h3l3 13h11l3-9H6m2 13h.01M18 20h.01"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
    perfil: '<circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
    empresas: '<path d="M4 22V3h12v19M16 10h5v12M8 7h4M8 11h4M8 15h4M9 22v-3h3v3"/>',
    busca: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    seta: '<path d="m9 5 7 7-7 7"/>',
    voltar: '<path d="m12 5-7 7 7 7M5 12h15"/>',
    sair: '<path d="M9 4H4v16h5m6-13 5 5-5 5M8 12h12"/>',
    check: '<path d="m5 12 4 4L20 5"/>',
    fechar: '<path d="m6 6 12 12M6 18 18 6"/>',
    olho: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    cadeado: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
    calendario: '<rect x="3" y="5" width="18" height="17" rx="3"/><path d="M7 2v6M17 2v6M3 11h18"/>',
    editar: '<path d="m15 3 6 6-12 12H3v-6ZM12 6l6 6"/>',
    alerta: '<path d="m12 3 10 18H2ZM12 9v5m0 3v.1"/>',
    dinheiro: '<rect x="2" y="5" width="20" height="14" rx="3"/><circle cx="12" cy="12" r="3"/><path d="M5 12h.1M19 12h.1"/>',
};

export function icone(nome) {

    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${caminhos[nome] || caminhos.produtos}</svg>`;

}

export function esc(valor) {

    return String(valor ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

}

export const dinheiro = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);

export function dataVenda(valor) {

    return new Date(String(valor).replace(' ', 'T') + (/Z$|[+-]\d\d:\d\d$/.test(valor) ? '' : 'Z'));

}

export const dataHora = (valor) => dataVenda(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function etiqueta(status) {

    return `<span class="etiqueta ${['ativo', 'inativo', 'concluida', 'cancelada'].includes(status) ? status : ''}">${esc({ ativo: 'Ativo', inativo: 'Inativo', concluida: 'Concluída', cancelada: 'Cancelada' }[status] || status)}</span>`;

}

export function estado(titulo, descricao = '', acao = '') {

    return `<div class="estado">${icone('produtos')}<strong>${esc(titulo)}</strong><p>${esc(descricao)}</p>${acao}</div>`;

}

export function erroTela(erro, alvo = document.querySelector('main')) {

    const aviso = document.createElement('div');

    aviso.className = 'aviso erro';

    aviso.setAttribute('role', 'alert');

    aviso.textContent = erro.message;

    alvo.prepend(aviso);

}

export function notificar(texto) {

    document.querySelector('.toast')?.remove();

    const el = document.createElement('div');

    el.className = 'toast';

    el.setAttribute('role', 'status');

    el.textContent = texto;

    document.body.append(el);

    setTimeout(() => el.remove(), 5000);

}

export async function iniciar(pagina, titulo, opcoes = {}) {

    const atual = await protegerPagina(opcoes);

    if (!atual) return null;

    const global = atual.escopo === 'superadmin';

    const perfil = atual.perfil;

    const links = global ? [['empresas', 'empresas', 'Empresas'], ['perfil', 'perfil', 'Meu perfil']] : [['dashboard', 'inicio', 'Dashboard'], ['clientes', 'clientes', 'Clientes'], ['produtos', 'produtos', 'Produtos'], ['vendas', 'vendas', 'Vendas'], ...(['admin', 'gerente'].includes(perfil.tipo) ? [['usuarios', 'clientes', 'Usuários']] : []), ['perfil', 'perfil', 'Meu perfil']];

    const link = ([rota, icon, label], mobile = false) => `<a href="/app/${rota}/${rota}.html" class="${mobile ? '' : 'nav-link'} ${pagina === rota ? 'ativo' : ''}" ${pagina === rota ? 'aria-current="page"' : ''}>${icone(icon)}<span>${label}</span></a>`;

    document.querySelector('#navegacao').innerHTML = `<aside class="lateral"><a class="marca" href="/app/${global ? 'empresas/empresas' : 'dashboard/dashboard'}.html"><span class="marca-icone">${icone('vendas')}</span><span>vértice<small>gestão de vendas</small></span></a><nav aria-label="Principal" class="nav-grupo"><span class="nav-label">${global ? 'ADMINISTRAÇÃO' : 'SEU ESPAÇO'}</span>${links.map(l => link(l)).join('')}</nav><div class="lateral-rodape"><div class="conta-mini"><span class="avatar">${esc(perfil.nome?.slice(0, 1).toUpperCase() || 'A')}</span><div><strong>${esc(perfil.nome)}</strong><small>${esc(perfil.tipo === 'superadmin' ? 'Administrador global' : perfil.empresa_nome)}</small></div></div><button class="botao fantasma largo" data-sair>${icone('sair')} Sair da conta</button></div></aside><header class="topo"><span class="topo-caminho">${esc(global ? 'Administração' : perfil.empresa_nome || 'Minha empresa')} <strong>/ ${esc(titulo)}</strong></span><div class="topo-direita"><span class="topo-data muted">${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span><a aria-label="Meu perfil" href="/app/perfil/perfil.html" class="avatar">${esc(perfil.nome?.slice(0, 1).toUpperCase() || 'A')}</a></div></header><nav class="mobile-nav" aria-label="Navegação móvel">${links.filter(l => l[0] !== 'usuarios').map(l => link(l, true)).join('')}</nav>`;

    document.querySelector('[data-sair]').addEventListener('click', () => sair());

    document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icone(el.dataset.icon); });

    return atual;

}

export function revelarSenha() {

    document.querySelectorAll('[data-senha]').forEach(botao => {

        botao.innerHTML = icone('olho');

        botao.addEventListener('click', () => {

            const campo = document.getElementById(botao.dataset.senha);

            campo.type = campo.type === 'password' ? 'text' : 'password';

            botao.setAttribute('aria-label', campo.type === 'password' ? 'Mostrar senha' : 'Ocultar senha');

        });

    });

}

export function erroFormulario(form, erro) {

    const el = form.querySelector('[data-erro]');

    el.textContent = erro?.message || '';

    el.hidden = !erro;

}

export async function enviarFormulario(form, operacao) {

    const botao = form.querySelector('[type="submit"]');

    if (botao.disabled) return;

    const texto = botao.innerHTML;

    botao.disabled = true;

    botao.textContent = 'Aguarde…';

    erroFormulario(form, null);

    try {

        await operacao();

    } catch (erro) {

        erroFormulario(form, erro);

    } finally {

        botao.innerHTML = texto;

        botao.disabled = false;

    }

}

export function confirmar(titulo, descricao, acao = 'Confirmar') {

    return new Promise(resolve => {

        const dialogo = document.createElement('dialog');

        dialogo.setAttribute('aria-label', titulo);

        dialogo.innerHTML = `<div class="icone-caixa laranja">${icone('alerta')}</div><h2 style="margin:18px 0 10px">${esc(titulo)}</h2><p class="muted">${esc(descricao)}</p><form method="dialog" class="rodape-formulario" style="margin-top:24px"><button class="botao secundario" value="nao" autofocus>Voltar</button><button class="botao perigo" value="sim">${esc(acao)}</button></form>`;

        document.body.append(dialogo);

        dialogo.addEventListener('close', () => { resolve(dialogo.returnValue === 'sim'); dialogo.remove(); });

        dialogo.showModal();

    });

}
