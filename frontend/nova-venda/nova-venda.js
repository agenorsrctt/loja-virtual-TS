import { api, registros } from '../compartilhado/api.js';

import { iniciar, esc, dinheiro, icone, estado, erroTela, confirmarComSenha } from '../compartilhado/interface.js';

let etapa = 1;

let clientes = [];

let produtos = [];

let cliente = null;

let original = null;

let enviando = false;
let proximoAvulso = -1;
let comentarios = '';
let entrada = 0;
let parcelas = 0;
let vencimento = '';
function adicionarAvulso(descricao, preco, quantidade) {
    const id = proximoAvulso--;
    produtos.push({ id, produto: descricao, preco, estoque: Number.MAX_SAFE_INTEGER, status: 'ativo', avulso: true });
    itens.set(id, quantidade);
}

const itens = new Map();

const id = Number(new URLSearchParams(location.search).get('id'));

function produto(idProduto) {

    return produtos.find(p => p.id === idProduto);

}

function disponivel(p) {

    return p.estoque + (original?.itens.find(i => i.produto_id === p.id)?.quantidade || 0);

}

function total() {

    return [...itens].reduce((soma, [idProduto, qtd]) => soma + Math.round(produto(idProduto).preco * 100) * qtd, 0) / 100;

}

function alerta(texto = '') {

    const el = document.querySelector('#erro-venda');

    el.textContent = texto;

    el.hidden = !texto;

}

function resumo() {

    document.querySelector('#carrinho').innerHTML = `<div class="painel-cabecalho"><h2>Sua venda</h2><span class="etiqueta azul">${itens.size} item(ns)</span></div><div class="cliente-resumo"><span class="icone-caixa azul">${icone('clientes')}</span><div><small>Cliente</small><strong>${esc(cliente?.nome || 'Selecione um cliente')}</strong></div></div><div class="itens-resumo">${itens.size ? [...itens].map(([idProduto, qtd]) => `<div class="linha"><span><strong>${esc(produto(idProduto).produto)}</strong><small>${qtd} × ${dinheiro(produto(idProduto).preco)}</small></span><strong>${dinheiro(Math.round(produto(idProduto).preco * 100) * qtd / 100)}</strong></div>`).join('') : '<p class="muted">Os produtos selecionados aparecerão aqui.</p>'}</div><div class="total"><span>Total</span><strong>${dinheiro(total())}</strong></div><small class="legenda-total">O valor final será confirmado com o preço e estoque atuais.</small>`;

}

function mudarEtapa(novaEtapa) {

    etapa = novaEtapa;

    alerta();

    desenhar();

    document.querySelector('#etapa-conteudo').scrollIntoView({ behavior: 'smooth', block: 'start' });

}

function desenhar() {

    document.querySelectorAll('[data-etapa]').forEach(el => {

        el.classList.toggle('atual', Number(el.dataset.etapa) === etapa);

        el.classList.toggle('completa', Number(el.dataset.etapa) < etapa);

        if (Number(el.dataset.etapa) === etapa) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');

    });

    resumo();

    const alvo = document.querySelector('#etapa-conteudo');

    if (etapa === 1) {

        alvo.innerHTML = `<div class="painel-cabecalho"><div><h2>Para quem é a venda?</h2><p>Selecione um cliente ativo para continuar.</p></div></div><label class="busca busca-etapa">${icone('busca')}<span class="sr-only">Buscar cliente</span><input type="search" placeholder="Buscar por nome ou telefone…" id="buscar-cliente"></label><div id="clientes-opcoes"></div><div class="rodape-etapa"><a href="../clientes/clientes.html?novo=1">Cadastrar novo cliente →</a><button class="botao" id="continuar" ${cliente ? '' : 'disabled'}>Escolher produtos ${icone('seta')}</button></div>`;

        const listar = () => {

            const busca = document.querySelector('#buscar-cliente').value.toLowerCase();

            const lista = clientes.filter(c => c.status === 'ativo' && `${c.nome} ${c.telefone}`.toLowerCase().includes(busca));

            document.querySelector('#clientes-opcoes').innerHTML = lista.length ? lista.map(c => `<button class="opcao-cliente ${cliente?.id === c.id ? 'escolhida' : ''}" data-cliente="${c.id}" aria-pressed="${cliente?.id === c.id}"><span class="avatar">${esc(c.nome[0].toUpperCase())}</span><span><strong>${esc(c.nome)}</strong><small>${esc(c.telefone)}</small></span>${icone(cliente?.id === c.id ? 'check' : 'seta')}</button>`).join('') : estado('Nenhum cliente ativo encontrado', 'Cadastre ou ative um cliente para continuar.');

            document.querySelectorAll('[data-cliente]').forEach(btn => { btn.onclick = () => { cliente = clientes.find(c => c.id === Number(btn.dataset.cliente)); listar(); resumo(); document.querySelector('#continuar').disabled = false; }; });

        };

        document.querySelector('#buscar-cliente').oninput = listar;

        document.querySelector('#continuar').onclick = () => mudarEtapa(2);

        listar();

    } else if (etapa === 2) {

        alvo.innerHTML = `<div class="painel-cabecalho"><div><h2>O que vamos vender?</h2><p>Adicione os produtos e ajuste as quantidades.</p></div></div><label class="busca busca-etapa">${icone('busca')}<span class="sr-only">Buscar produto</span><input id="buscar-produto" type="search" placeholder="Buscar produto ou código…"></label><div id="produtos-opcoes"></div><div class="rodape-etapa"><button class="botao secundario" id="voltar">Voltar</button><button class="botao" id="continuar" ${itens.size ? '' : 'disabled'}>Revisar venda ${icone('seta')}</button></div>`;

        const listar = () => {

            const busca = document.querySelector('#buscar-produto').value.toLowerCase();

            const lista = produtos.filter(p => (p.status === 'ativo' || itens.has(p.id)) && `${p.produto} ${p.codigo}`.toLowerCase().includes(busca));

            document.querySelector('#produtos-opcoes').innerHTML = lista.length ? lista.map(p => `<div class="produto-opcao"><span class="icone-caixa ${itens.has(p.id) ? 'azul' : 'roxo'}">${icone('produtos')}</span><div class="produto-descricao"><strong>${esc(p.produto)}</strong><small>${dinheiro(p.preco)} · ${p.avulso ? 'Item avulso, sem estoque' : disponivel(p) + ' disponíveis'}${p.status !== 'ativo' ? ' · Inativo: remova este item' : ''}</small></div><div class="quantidade"><button data-menos="${p.id}" aria-label="Diminuir quantidade de ${esc(p.produto)}" ${!itens.has(p.id) ? 'disabled' : ''}>−</button><input aria-label="Quantidade de ${esc(p.produto)}" type="number" min="0" max="${disponivel(p)}" step="1" data-qtd="${p.id}" value="${itens.get(p.id) || 0}"><button data-mais="${p.id}" aria-label="Adicionar ${esc(p.produto)}" ${p.status !== 'ativo' || disponivel(p) <= (itens.get(p.id) || 0) ? 'disabled' : ''}>+</button></div></div>`).join('') : estado('Nenhum produto encontrado', 'Adicione um item avulso acima ou cadastre um produto.');

            const ajustar = (idProduto, quantidade) => {

                const p = produto(idProduto);

                if (!Number.isInteger(quantidade) || quantidade < 0 || quantidade > disponivel(p) || (p.status !== 'ativo' && quantidade > 0)) {

                    alerta('Informe uma quantidade inteira dentro do estoque disponível. Produtos inativos devem ser removidos.');

                    listar();

                    return;

                }

                if (quantidade === 0) itens.delete(idProduto); else itens.set(idProduto, quantidade);

                alerta();

                listar();

                resumo();

                document.querySelector('#continuar').disabled = !itens.size;

            };

            document.querySelectorAll('[data-menos]').forEach(btn => { btn.onclick = () => ajustar(Number(btn.dataset.menos), itens.get(Number(btn.dataset.menos)) - 1); });

            document.querySelectorAll('[data-mais]').forEach(btn => { btn.onclick = () => ajustar(Number(btn.dataset.mais), (itens.get(Number(btn.dataset.mais)) || 0) + 1); });

            document.querySelectorAll('[data-qtd]').forEach(input => { input.onchange = () => ajustar(Number(input.dataset.qtd), Number(input.value)); });

        };

        document.querySelector('#buscar-produto').closest('label').insertAdjacentHTML('beforebegin', `<form id="avulso" class="form-avulso"><h3>Item avulso</h3><p class="muted">Informe o produto desta compra, sem cadastrar no catálogo.</p><div class="campos-venda"><label>Descrição<input id="avulso-descricao" maxlength="200" required placeholder="Ex.: Camiseta azul, tamanho M"></label><label>Preço unitário (R$)<input id="avulso-preco" type="number" min="0.01" step="0.01" required></label><label>Quantidade<input id="avulso-qtd" type="number" min="1" step="1" value="1" required></label></div><button class="botao secundario" type="submit">Adicionar item avulso</button></form>`);
        document.querySelector('#avulso').onsubmit = evento => {
            evento.preventDefault();
            const descricao = document.querySelector('#avulso-descricao').value.trim();
            const preco = Number(document.querySelector('#avulso-preco').value);
            const qtd = Number(document.querySelector('#avulso-qtd').value);
            if (!descricao || !Number.isFinite(preco) || preco <= 0 || !Number.isSafeInteger(qtd) || qtd <= 0) return alerta('Confira descrição, preço e quantidade.');
            adicionarAvulso(descricao, preco, qtd);
            evento.target.reset();
            alerta(); listar(); resumo();
            document.querySelector('#continuar').disabled = false;
        };
        document.querySelector('#buscar-produto').oninput = listar;

        document.querySelector('#voltar').onclick = () => mudarEtapa(1);

        document.querySelector('#continuar').onclick = () => mudarEtapa(3);

        listar();

    } else {

        alvo.innerHTML = `<div class="painel-cabecalho"><div><h2>Tudo certo para finalizar?</h2><p>Confira os detalhes antes de confirmar.</p></div><span class="icone-caixa verde">${icone('check')}</span></div><div class="linha"><span><small>Cliente</small><strong>${esc(cliente.nome)}</strong><small>${esc(cliente.telefone)}</small></span><button class="botao fantasma" id="trocar-cliente">Trocar</button></div>${[...itens].map(([idProduto, qtd]) => `<div class="linha"><div><strong>${esc(produto(idProduto).produto)}</strong><small>${qtd} unidade(s) × ${dinheiro(produto(idProduto).preco)}</small></div><strong>${dinheiro(Math.round(produto(idProduto).preco * 100) * qtd / 100)}</strong></div>`).join('')}<div class="total"><span>Total previsto</span><strong>${dinheiro(total())}</strong></div><div class="aviso info" style="margin-top:22px">${id ? 'A lista de itens será substituída e recalculada com os preços atuais.' : 'Ao confirmar, os itens avulsos serão registrados e o estoque dos produtos cadastrados será atualizado.'}</div><div class="rodape-etapa"><button class="botao secundario" id="voltar">Revisar produtos</button><button class="botao sucesso" id="finalizar">${icone('check')} ${id ? 'Salvar alterações' : 'Finalizar venda'}</button></div>`;

        document.querySelector('#finalizar').closest('.rodape-etapa').insertAdjacentHTML('beforebegin', `<div class="condicoes-venda"><label>Comentários da venda<textarea id="comentarios" rows="3" maxlength="2000" placeholder="Detalhes do pedido, entrega ou acordo com o cliente">${esc(comentarios)}</textarea></label>${id ? '' : `<div class="campos-venda"><label>Entrada recebida (R$)<input id="entrada" type="number" min="0" step="0.01" max="${total()}" value="${entrada}"></label><label>Parcelas mensais do saldo<input id="parcelas" type="number" min="0" max="120" step="1" value="${parcelas}"><small>0 = sem parcelamento</small></label><label>Primeiro vencimento<input id="vencimento" type="date" value="${esc(vencimento)}"></label></div><p id="previsao-parcelas" class="muted"></p>`} </div>`);
        document.querySelector('#comentarios').oninput = e => { comentarios = e.target.value; };
        if (!id) {
            const atualizar = () => {
                entrada = Number(document.querySelector('#entrada').value);
                parcelas = Number(document.querySelector('#parcelas').value);
                vencimento = document.querySelector('#vencimento').value;
                const saldo = Math.round(total() * 100) - Math.round(entrada * 100);
                document.querySelector('#previsao-parcelas').textContent = parcelas > 0 && saldo >= parcelas ? `Saldo de ${dinheiro(saldo / 100)} em ${parcelas} parcela(s) de aproximadamente ${dinheiro(Math.floor(saldo / parcelas) / 100)}. Centavos restantes são distribuídos nas primeiras parcelas.` : `Saldo a receber: ${dinheiro(saldo / 100)}.`;
            };
            ['entrada','parcelas','vencimento'].forEach(id => { document.getElementById(id).oninput = atualizar; });
            atualizar();
        }
        document.querySelector('#trocar-cliente').onclick = () => mudarEtapa(1);

        document.querySelector('#voltar').onclick = () => mudarEtapa(2);

        document.querySelector('#finalizar').onclick = finalizar;

    }

}

async function finalizar() {

    if (enviando) return;
    if (!id && (!Number.isFinite(entrada) || entrada < 0 || entrada > total() || !Number.isInteger(parcelas) || parcelas < 0 || parcelas > 120 || (parcelas > 0 && !vencimento))) return alerta('Confira a entrada, o número de parcelas e o primeiro vencimento.');

    enviando = true;

    const botao = document.querySelector('#finalizar');

    botao.disabled = true;

    botao.textContent = 'Confirmando…';

    try {

        const resposta = await api('/vendas' + (id ? '/' + id : ''), { method: id ? 'PATCH' : 'POST', body: { cliente_id: cliente.id, comentarios, ...(!id ? { entrada, ...(parcelas > 0 ? { parcelamento: { quantidade: parcelas, primeiro_vencimento: vencimento } } : {}) } : {}), itens: [...itens].map(([produto_id, quantidade]) => produto_id < 0 ? { descricao: produto(produto_id).produto, valor_unitario: produto(produto_id).preco, quantidade } : { produto_id, quantidade }) } });

        location.assign(id ? `../detalhes-venda/detalhes-venda.html?id=${resposta.dados.id}` : `../venda-concluida/venda-concluida.html?id=${resposta.dados.id}`);

    } catch (erro) {

        alerta(erro.message);

        botao.disabled = false;

        botao.textContent = id ? 'Salvar alterações' : 'Finalizar venda';

        enviando = false;

    }

}

async function carregar() {

    if (!await iniciar('vendas', id ? 'Editar venda' : 'Nova venda')) return;

    const [rc, rp] = await Promise.all([api('/clientes'), api('/produtos')]);

    clientes = registros(rc);

    produtos = registros(rp);

    if (id) {

        original = (await api('/vendas/' + id)).dados;

        if (original.status !== 'pendente') throw new Error('Somente vendas pendentes podem ser alteradas.');

        cliente = clientes.find(c => c.id === original.cliente_id && c.status === 'ativo') || null;

        if (original.valor_pago > 0 || original.parcelas.length > 0) throw new Error('Esta venda tem recebimentos ou parcelas. Edite os comentários na tela de detalhes.');
        document.querySelector('#titulo-venda').insertAdjacentHTML('afterend', '<button class="botao perigo" id="excluir-venda">Excluir venda</button>');
        document.querySelector('#excluir-venda').onclick = async () => {
            if (await confirmarComSenha(`Excluir venda #${id}?`, 'A venda e seus itens serão apagados permanentemente. O estoque dos produtos cadastrados será devolvido. Deseja continuar?',
                senha_atual => api('/vendas/' + id + '/excluir', { method: 'DELETE', body: { senha_atual } }))) location.assign('../vendas/vendas.html');
        };
        comentarios = original.comentarios || '';
        original.itens.forEach(i => { if (i.produto_id == null) adicionarAvulso(i.descricao, i.valor_vendido, i.quantidade); else if (produto(i.produto_id)) itens.set(i.produto_id, i.quantidade); });

        document.querySelector('#titulo-venda').textContent = `Editar venda #${id}`;

    }

    desenhar();

}

carregar().catch(erro => { document.querySelector('#etapa-conteudo').innerHTML = ''; erroTela(erro); });
