import { api, sessao, sair } from '../compartilhado/api.js';

import { iniciar, esc, icone, revelarSenha, enviarFormulario, erroTela } from '../compartilhado/interface.js';

async function carregar() {

    const atual = await iniciar('perfil', 'Meu perfil', { global: sessao()?.escopo === 'superadmin' });

    if (!atual) return;

    const perfil = atual.perfil;

    document.querySelector('#minha-conta').innerHTML = `<span class="avatar avatar-grande">${esc(perfil.nome[0].toUpperCase())}</span><h2>${esc(perfil.nome)}</h2><p class="muted">${esc(perfil.email)}</p><span class="etiqueta azul" style="margin-top:15px">${esc({ superadmin: 'SuperAdmin', admin: 'Administrador', gerente: 'Gerente', colaborador: 'Colaborador' }[perfil.tipo])}</span><div class="separador"></div><div class="linha"><span class="muted">${perfil.tipo === 'superadmin' ? 'Acesso' : 'Empresa'}</span><strong>${esc(perfil.empresa_nome || 'Administração global')}</strong></div>${perfil.empresa_id ? `<div class="linha"><span class="muted">Código da empresa</span><strong>#${perfil.empresa_id}</strong></div>` : ''}${['admin', 'gerente'].includes(perfil.tipo) ? '<a class="botao secundario largo" style="margin-top:20px" href="../usuarios/usuarios.html">Gerenciar equipe →</a>' : ''}`;

    document.querySelector('#sair').onclick = () => sair();

    revelarSenha();

    document.querySelector('#form-senha').onsubmit = (evento) => {

        evento.preventDefault();

        enviarFormulario(evento.target, async () => {

            const dados = Object.fromEntries(new FormData(evento.target));

            if (dados.nova_senha !== dados.confirmar) throw new Error('As senhas não coincidem.');

            if (new TextEncoder().encode(dados.nova_senha).length > 72) throw new Error('A nova senha deve ter no máximo 72 bytes.');

            await api(atual.escopo === 'superadmin' ? '/administracao/senha' : '/usuarios/senha', { method: 'PATCH', body: { senha_atual: dados.senha_atual, nova_senha: dados.nova_senha }, manterSessao: true });

            sair('Senha alterada com sucesso. Entre com sua nova senha.');

        });

    };

}

carregar().catch(erroTela);
