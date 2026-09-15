import { api } from '../compartilhado/api.js';

import { iniciar, esc, dinheiro, dataHora, icone, erroTela } from '../compartilhado/interface.js';

async function carregar() {

    if (!await iniciar('vendas', 'Venda realizada')) return;

    const id = Number(new URLSearchParams(location.search).get('id'));

    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Selecione uma venda válida.');

    const venda = (await api('/vendas/' + id)).dados;

    if (venda.status !== 'pendente') {

        location.replace('../detalhes-venda/detalhes-venda.html?id=' + id);

        return;

    }

    const cliente = (await api('/clientes/' + venda.cliente_id)).dados;

    document.querySelector('#comprovante').innerHTML = `<div class="sucesso-circulo">${icone('check')}</div><span class="sobretitulo">MAIS UMA CONQUISTA</span><h1>Venda realizada!</h1><p class="muted">Venda pendente de pagamento. Seu estoque já foi atualizado.</p><div class="resumo-sucesso"><strong>Venda #${id}</strong><p>${esc(cliente.nome)}</p><b>${dinheiro(venda.valor_total)}</b><small>${dataHora(venda.data)}</small></div><a class="botao largo" href="../nova-venda/nova-venda.html">Fazer uma nova venda ${icone('mais')}</a><a class="botao fantasma largo" href="../detalhes-venda/detalhes-venda.html?id=${id}">Ver detalhes da venda →</a>`;

}

carregar().catch(erro => { document.querySelector('#comprovante').innerHTML = ''; erroTela(erro); });
