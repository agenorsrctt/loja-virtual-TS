import { api, registros, sessao, sair } from './api.js';

import { iniciar, esc, icone, etiqueta, dinheiro, estado, erroTela, enviarFormulario, confirmar, notificar } from './interface.js';

const configuracoes = {
    clientes: { titulo: 'Clientes', singular: 'cliente', nome: 'nome', icone: 'clientes', campos: [['nome', 'Nome completo', 'text', true], ['email', 'E-mail', 'email', false], ['telefone', 'Telefone', 'tel', true]], colunas: ['Cliente', 'Contato', 'Status'], celulas: r => [`<strong>${esc(r.nome)}</strong><small>#${r.id}</small>`, `${esc(r.telefone)}<small>${esc(r.email || 'Sem e-mail')}</small>`, etiqueta(r.status)] },
    produtos: { titulo: 'Produtos', singular: 'produto', nome: 'produto', icone: 'produtos', campos: [['produto', 'Nome do produto', 'text', true], ['codigo', 'Código', 'text', true], ['categoria', 'Categoria', 'text', true], ['preco', 'Preço unitário (R$)', 'number', true], ['estoque', 'Quantidade em estoque', 'number', true]], colunas: ['Produto', 'Preço', 'Estoque', 'Status'], celulas: r => [`<strong>${esc(r.produto)}</strong><small>${esc(r.codigo)} · ${esc(r.categoria)}</small>`, `<strong>${dinheiro(r.preco)}</strong>`, `<span class="${r.estoque <= 5 ? 'estoque-baixo' : ''}">${r.estoque} un.</span>`, etiqueta(r.status)] },
    empresas: { titulo: 'Empresas', singular: 'empresa', nome: 'empresa', icone: 'empresas', campos: [['empresa', 'Nome da empresa', 'text', true], ['cnpj', 'CNPJ', 'text', true]], colunas: ['Empresa', 'CNPJ', 'Status'], celulas: r => [`<strong>${esc(r.empresa)}</strong><small>Código da empresa: ${r.id}</small>`, esc(r.cnpj), etiqueta(r.status)] },
    usuarios: { titulo: 'Usuários', singular: 'usuário', nome: 'nome', icone: 'perfil', campos: [['nome', 'Nome completo', 'text', true], ['email', 'E-mail', 'email', true], ['senha', 'Senha inicial', 'password', true]], colunas: ['Usuário', 'Perfil', 'Status'], celulas: r => [`<strong>${esc(r.nome)}</strong><small>${esc(r.email)}</small>`, esc({ admin: 'Administrador', gerente: 'Gerente', colaborador: 'Colaborador' }[r.tipo]), etiqueta(r.status)] },
};

export async function montarCadastro(tipo) {

    const config = configuracoes[tipo];

    const atual = await iniciar(tipo, config.titulo, { global: tipo === 'empresas' });

    if (!atual) return;

    if (tipo === 'usuarios' && !['admin', 'gerente'].includes(atual.perfil.tipo)) {

        document.querySelector('#cadastro').innerHTML = estado('Acesso restrito', 'Somente administradores e gerentes gerenciam a equipe.');

        document.querySelector('#novo').hidden = true;

        return;

    }

    const painel = document.querySelector('#cadastro');

    painel.innerHTML = `<div class="filtros"><label class="busca">${icone('busca')}<span class="sr-only">Buscar ${esc(config.singular)}</span><input id="busca" type="search" placeholder="Buscar ${esc(config.singular)}…"></label><label><span class="sr-only">Status</span><select id="filtro-status"><option value="">Todos os status</option><option value="ativo">Ativos</option><option value="inativo">Inativos</option></select></label>${tipo === 'produtos' ? '<label><span class="sr-only">Estoque</span><select id="filtro-estoque"><option value="">Todo o estoque</option><option value="baixo">Estoque baixo (até 5)</option></select></label>' : ''}</div><div id="lista"><div class="carregando">Carregando ${esc(config.titulo.toLowerCase())}</div></div>`;

    let todos = [];

    let pagina = 1;

    const parametros = new URLSearchParams(location.search);

    if (tipo === 'produtos' && parametros.get('estoque') === 'baixo') document.querySelector('#filtro-estoque').value = 'baixo';

    async function carregar() {

        todos = registros(await api('/' + tipo));

        desenhar();

        if (tipo === 'empresas') {

            document.querySelector('#resumo-empresas').innerHTML = [['Empresas cadastradas', todos.length, 'empresas', 'azul'], ['Empresas ativas', todos.filter(r => r.status === 'ativo').length, 'check', 'verde'], ['Empresas inativas', todos.filter(r => r.status === 'inativo').length, 'cadeado', 'roxo']].map(([nome, valor, icon, cor]) => `<article class="metrica"><span class="icone-caixa ${cor}">${icone(icon)}</span><p>${nome}</p><strong>${valor}</strong><small>Visão da administração</small></article>`).join('');

        }

    }

    function desenhar() {

        const busca = document.querySelector('#busca').value.toLocaleLowerCase('pt-BR');

        const status = document.querySelector('#filtro-status').value;

        const baixo = document.querySelector('#filtro-estoque')?.value === 'baixo';

        const filtrados = todos.filter(r => (!status || r.status === status) && (!baixo || r.estoque <= 5) && Object.values(r).join(' ').toLocaleLowerCase('pt-BR').includes(busca));

        const paginas = Math.max(1, Math.ceil(filtrados.length / 10));

        pagina = Math.min(pagina, paginas);

        const lista = document.querySelector('#lista');

        if (!filtrados.length) {

            lista.innerHTML = estado(todos.length ? 'Nenhum resultado por aqui' : `Seu primeiro ${config.singular} começa aqui`, todos.length ? 'Experimente outra busca ou filtro.' : `Clique em Novo ${config.singular} para começar.`);

            return;

        }

        lista.innerHTML = `<div class="tabela-wrap"><table class="tabela-responsiva"><thead><tr>${config.colunas.map(c => `<th scope="col">${c}</th>`).join('')}<th scope="col" class="sr-only">Ações</th></tr></thead><tbody>${filtrados.slice((pagina - 1) * 10, pagina * 10).map(r => `<tr>${config.celulas(r).map((celula, indice) => `<td data-label="${config.colunas[indice]}">${celula}</td>`).join('')}<td><div class="acoes-tabela"><button data-editar="${r.id}" aria-label="Editar ${esc(r[config.nome])}">Editar</button>${r.status === 'ativo' ? `<button data-inativar="${r.id}" aria-label="Inativar ${esc(r[config.nome])}">Inativar</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div><div class="paginacao"><small>${filtrados.length} registro(s) · Página ${pagina} de ${paginas}</small><div><button class="botao secundario" id="anterior" ${pagina === 1 ? 'disabled' : ''}>Anterior</button><button class="botao secundario" id="proxima" ${pagina === paginas ? 'disabled' : ''}>Próxima</button></div></div>`;

        lista.querySelector('#anterior').onclick = () => { pagina--; desenhar(); };

        lista.querySelector('#proxima').onclick = () => { pagina++; desenhar(); };

        lista.querySelectorAll('[data-editar]').forEach(btn => { btn.onclick = () => editar(todos.find(r => r.id === Number(btn.dataset.editar))); });

        lista.querySelectorAll('[data-inativar]').forEach(btn => {

            btn.onclick = async () => {

                const id = Number(btn.dataset.inativar);

                if (!await confirmar(`Inativar ${config.singular}?`, 'O registro será preservado, mas ficará inativo.', 'Sim, inativar')) return;

                btn.disabled = true;

                try {

                    await api(`/${tipo}/${id}`, { method: 'DELETE' });

                    if (tipo === 'usuarios' && id === atual.perfil.id) return sair('Sua conta foi inativada.');

                    await carregar();

                    notificar(`${config.singular} inativado com sucesso.`);

                } catch (erro) {

                    notificar(erro.message);

                    btn.disabled = false;

                }

            };

        });

    }

    function editar(registro = null) {

        const dialogo = document.createElement('dialog');

        dialogo.setAttribute('aria-label', `${registro ? 'Editar' : 'Novo'} ${config.singular}`);

        const campos = config.campos.map(([nome, rotulo, campoTipo, obrigatorio]) => {

            if (nome === 'senha' && registro) return `<div class="campo"><label for="cad-senha">Nova senha (opcional)</label><input id="cad-senha" name="senha" type="password" autocomplete="new-password" minlength="12" placeholder="Deixe vazio para manter"></div>`;

            return `<div class="campo"><label for="cad-${nome}">${rotulo}${obrigatorio ? '' : ' (opcional)'}</label><input id="cad-${nome}" name="${nome}" type="${campoTipo}" value="${esc(registro?.[nome] ?? '')}" ${obrigatorio ? 'required' : ''} ${nome === 'preco' ? 'min="0.01" step="0.01"' : nome === 'estoque' ? 'min="0" step="1"' : nome === 'senha' ? 'minlength="12" autocomplete="new-password"' : ''}></div>`;

        }).join('');

        dialogo.innerHTML = `<div class="dialogo-topo"><h2>${registro ? 'Editar' : 'Novo'} ${config.singular}</h2><button class="botao secundario icone" type="button" data-fechar aria-label="Fechar">${icone('fechar')}</button></div><form class="formulario">${campos}${tipo === 'usuarios' ? `<div class="campo"><label for="cad-tipo">Perfil</label><select id="cad-tipo" name="tipo"><option value="colaborador">Colaborador</option><option value="gerente">Gerente</option><option value="admin">Administrador</option></select></div>` : ''}${tipo !== 'empresas' || registro ? '<div class="campo"><label for="cad-status">Status</label><select id="cad-status" name="status"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div>' : '<p class="aviso info">O primeiro administrador será criado automaticamente. Guarde as credenciais exibidas após o cadastro.</p>'}<div data-erro class="aviso erro" role="alert" hidden></div><div class="rodape-formulario"><button type="button" data-fechar class="botao secundario">Voltar</button><button class="botao" type="submit">${registro ? 'Salvar alterações' : 'Cadastrar'}</button></div></form>`;

        document.body.append(dialogo);

        dialogo.querySelectorAll('[data-fechar]').forEach(btn => { btn.onclick = () => dialogo.close(); });

        dialogo.addEventListener('close', () => dialogo.remove());

        if (registro?.status) dialogo.querySelector('[name="status"]').value = registro.status;

        if (registro?.tipo) dialogo.querySelector('[name="tipo"]').value = registro.tipo;

        if (!registro && tipo === 'usuarios') {

            dialogo.querySelector('[name="status"]').closest('.campo').hidden = true;

        }

        dialogo.querySelector('form').onsubmit = (evento) => {

            evento.preventDefault();

            enviarFormulario(evento.target, async () => {

                const dados = Object.fromEntries(new FormData(evento.target));

                if (tipo === 'produtos') {

                    dados.preco = Number(dados.preco);

                    dados.estoque = Number(dados.estoque);

                }

                if (tipo === 'clientes' && !dados.email) delete dados.email;

                if (tipo === 'usuarios' && !dados.senha) delete dados.senha;

                const resposta = await api('/' + tipo + (registro ? '/' + registro.id : ''), { method: registro ? 'PATCH' : 'POST', body: dados });

                dialogo.close();

                if (tipo === 'usuarios' && registro?.id === atual.perfil.id) return sair('Cadastro atualizado. Entre novamente.');

                if (tipo === 'empresas' && !registro) credenciais(resposta.dados);

                await carregar();

                notificar('Cadastro salvo com sucesso.');

            });

        };

        dialogo.showModal();

    }

    document.querySelector('#novo').onclick = () => editar();

    painel.querySelectorAll('input, select').forEach(el => { el.addEventListener('input', () => { pagina = 1; desenhar(); }); });

    await carregar();

    if (parametros.get('novo') === '1') editar();

}

function credenciais(empresa) {

    const admin = empresa.administrador;

    const texto = `Empresa: ${empresa.empresa}\nCódigo: ${empresa.id}\nE-mail: ${admin.email}\nSenha temporária: ${admin.senha_temporaria}`;

    const dialogo = document.createElement('dialog');

    dialogo.setAttribute('aria-label', 'Credenciais do primeiro administrador');

    dialogo.innerHTML = `<span class="icone-caixa verde">${icone('check')}</span><h2 style="margin:18px 0">Empresa criada!</h2><p class="muted">Guarde as credenciais e entregue ao responsável. Ele trocará o e-mail e a senha no primeiro acesso.</p><pre class="credenciais"></pre><div class="rodape-formulario"><button class="botao secundario" id="copiar">Copiar credenciais</button><button class="botao" id="pronto">Já guardei</button></div><p id="resultado-copia" role="status"></p>`;

    dialogo.querySelector('pre').textContent = texto;

    dialogo.querySelector('#copiar').onclick = async () => {

        try {

            await navigator.clipboard.writeText(texto);

            dialogo.querySelector('#resultado-copia').textContent = 'Credenciais copiadas.';

        } catch {

            dialogo.querySelector('#resultado-copia').textContent = 'Selecione o texto acima e copie manualmente.';

        }

    };

    dialogo.querySelector('#pronto').onclick = () => dialogo.close();

    dialogo.addEventListener('close', () => dialogo.remove());

    document.body.append(dialogo);

    dialogo.showModal();

}
