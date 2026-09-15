import { montarCadastro } from '../compartilhado/cadastros.js';

import { erroTela } from '../compartilhado/interface.js';
import { api, sessao } from '../compartilhado/api.js';

montarCadastro('empresas').then(async () => {
    if (sessao()?.escopo !== 'superadmin') return;
    document.querySelector('#visitas-site').hidden = false;
    const total = document.querySelector('#total-visitas');
    try {
        const { dados } = await api('/administracao/visitas');
        total.textContent = Number(dados.total).toLocaleString('pt-BR') + ' visitas';
    } catch {
        total.textContent = 'Visitas indisponíveis no momento. Atualize a página para tentar novamente.';
    }
}).catch(erroTela);
