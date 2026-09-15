import { api, salvarSessao } from '../compartilhado/api.js';
import { registrarVisita } from './visitas.js';

void registrarVisita();

import { icone, revelarSenha, enviarFormulario } from '../compartilhado/interface.js';

document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icone(el.dataset.icon); });

revelarSenha();

let global = false;

const aviso = new URLSearchParams(location.search).get('aviso');

if (aviso) {

    document.querySelector('#aviso').textContent = aviso;

    document.querySelector('#aviso').hidden = false;

}

function selecionar(valor) {

    global = valor;

    document.querySelector('#campo-empresa').hidden = global;

    document.querySelector('#empresa_id').required = !global;

    ['aba-empresa', 'aba-global'].forEach((id, indice) => {

        const selecionado = global === Boolean(indice);

        document.getElementById(id).classList.toggle('selecionado', selecionado);

        document.getElementById(id).setAttribute('aria-pressed', String(selecionado));

    });

    document.querySelector('#ajuda').textContent = global ? 'Acesso exclusivo à administração das empresas.' : 'Primeiro acesso? Use as credenciais recebidas do administrador.';

}

document.querySelector('#aba-empresa').onclick = () => selecionar(false);

document.querySelector('#aba-global').onclick = () => selecionar(true);

document.querySelector('#login').addEventListener('submit', (evento) => {

    evento.preventDefault();

    const tipoGlobal = global;

    enviarFormulario(evento.target, async () => {

        const valores = Object.fromEntries(new FormData(evento.target));

        const dados = await api(tipoGlobal ? '/administracao/login' : '/usuarios/login', { method: 'POST', publica: true, body: { email: valores.email, senha: valores.senha, ...(!tipoGlobal ? { empresa_id: Number(valores.empresa_id) } : {}) } });

        salvarSessao({ token: dados.token, escopo: tipoGlobal ? 'superadmin' : 'empresa', primeiro_acesso: Boolean(dados.primeiro_acesso) });

        location.assign(dados.primeiro_acesso ? '../primeiro-acesso/primeiro-acesso.html' : tipoGlobal ? '../empresas/empresas.html' : '../dashboard/dashboard.html');

    });

});
