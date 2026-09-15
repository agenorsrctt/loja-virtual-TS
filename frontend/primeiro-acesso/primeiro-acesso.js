import { api, protegerPagina, sair } from '../compartilhado/api.js';

import { icone, revelarSenha, enviarFormulario, erroTela } from '../compartilhado/interface.js';

async function carregar() {

    if (!await protegerPagina({ primeiro: true })) return;

    document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icone(el.dataset.icon); });

    revelarSenha();

    document.querySelector('#sair').onclick = () => sair();

    document.querySelector('#primeiro').onsubmit = (evento) => {

        evento.preventDefault();

        enviarFormulario(evento.target, async () => {

            const dados = Object.fromEntries(new FormData(evento.target));

            if (dados.nova_senha !== dados.confirmar) throw new Error('As senhas não coincidem.');

            if (new TextEncoder().encode(dados.nova_senha).length > 72) throw new Error('A senha deve ter no máximo 72 bytes.');

            await api('/usuarios/primeiro-acesso', { method: 'PATCH', body: { novo_email: dados.novo_email, nova_senha: dados.nova_senha } });

            sair('Conta liberada! Entre com seu novo e-mail e senha.');

        });

    };

}

carregar().catch(erroTela);
