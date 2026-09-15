import { api, registros } from '../compartilhado/api.js';

import { iniciar, esc, dinheiro, dataHora, etiqueta, icone, erroTela, confirmar, notificar } from '../compartilhado/interface.js';

async function carregar() {

    if (!await iniciar('vendas', 'Detalhes da venda')) return;

    const id = Number(new URLSearchParams(location.search).get('id'));

    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Selecione uma venda válida na lista.');

    const [rv, rc, rp] = await Promise.all([api('/vendas/' + id), api('/clientes'), api('/produtos')]);

    const venda = rv.dados;

    const cliente = registros(rc).find(c => c.id === venda.cliente_id);

    const nomes = new Map(registros(rp).map(p => [p.id, p.produto]));

    document.querySelector('#detalhes').innerHTML = `<div class="cabecalho-pagina"><div><h1>Venda #${venda.id}</h1><p>Realizada em ${dataHora(venda.data)}</p></div>${etiqueta(venda.status)}</div><div class="grade duas-colunas"><section class="painel"><div class="painel-cabecalho"><h2>Itens da venda</h2><span class="muted">${venda.itens.length} item(ns)</span></div>${venda.itens.map(i => `<div class="linha"><span class="linha-inicio"><span class="icone-caixa roxo">${icone('produtos')}</span><span><strong>${esc(nomes.get(i.produto_id) || 'Produto #' + i.produto_id)}</strong><small>${i.quantidade} unidade(s) × ${dinheiro(i.valor_vendido)}</small></span></span><strong>${dinheiro(Math.round(i.valor_vendido * 100) * i.quantidade / 100)}</strong></div>`).join('')}<div class="total"><span>Total da venda</span><strong>${dinheiro(venda.valor_total)}</strong></div></section><div class="pilha"><section class="painel"><h2>Cliente</h2><div class="linha"><span class="linha-inicio"><span class="avatar">${esc(cliente?.nome?.[0] || 'C')}</span><span><strong>${esc(cliente?.nome || 'Cliente #' + venda.cliente_id)}</strong><small>${esc(cliente?.telefone || '')}</small></span></span></div><p class="muted">${esc(cliente?.email || 'Sem e-mail cadastrado')}</p><div class="separador"></div><small>Registrada pelo usuário #${venda.usuario_id}</small></section>${venda.status !== 'cancelado' ? `<section class="painel pilha">${venda.status === 'pendente' ? `<button class="botao" id="pagar">Marcar como pago</button><a class="botao secundario" href="../nova-venda/nova-venda.html?id=${venda.id}">${icone('editar')} Editar venda</a>` : '<p class="muted">Pagamento registrado.</p>'}<button class="botao perigo" id="cancelar">Cancelar venda</button></section>` : '<div class="aviso info">Esta venda foi cancelada. O estoque já foi devolvido, e o registro foi preservado para consulta.</div>'}</div></div>`;

    document.querySelector('#pagar')?.addEventListener('click', async (evento) => {

        if (!await confirmar('Confirmar pagamento?', 'Marque como pago somente após receber o pagamento.', 'Marcar como pago')) return;

        evento.target.disabled = true;

        try {

            await api('/vendas/' + venda.id + '/pagar', { method: 'PATCH' });

            await carregar();

            notificar('Pagamento registrado.');

        } catch (erro) {

            evento.target.disabled = false;

            erroTela(erro);

        }

    });

    document.querySelector('#cancelar')?.addEventListener('click', async (evento) => {

        if (!await confirmar(`Cancelar venda #${venda.id}?`, 'Os produtos voltarão ao estoque. A venda será preservada para consulta e não poderá ser reativada.', 'Sim, cancelar venda')) return;

        evento.target.disabled = true;

        try {

            await api('/vendas/' + venda.id, { method: 'DELETE' });

            await carregar();

            notificar('Venda cancelada. Estoque devolvido.');

        } catch (erro) {

            evento.target.disabled = false;

            erroTela(erro);

        }

    });

}

carregar().catch(erro => { document.querySelector('#detalhes').innerHTML = ''; erroTela(erro); });
