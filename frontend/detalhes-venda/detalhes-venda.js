import { api, registros } from '../compartilhado/api.js';

import { iniciar, esc, dinheiro, dataHora, etiqueta, icone, erroTela, confirmar, confirmarComSenha, notificar } from '../compartilhado/interface.js';

async function carregar() {

    if (!await iniciar('vendas', 'Detalhes da venda')) return;

    const id = Number(new URLSearchParams(location.search).get('id'));

    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Selecione uma venda válida na lista.');

    const [rv, rc, rp] = await Promise.all([api('/vendas/' + id), api('/clientes'), api('/produtos')]);

    const venda = rv.dados;

    const cliente = registros(rc).find(c => c.id === venda.cliente_id);

    const nomes = new Map(registros(rp).map(p => [p.id, p.produto]));

    document.querySelector('#detalhes').innerHTML = `<div class="cabecalho-pagina"><div><h1>Venda #${venda.id}</h1><p>Realizada em ${dataHora(venda.data)}</p></div>${etiqueta(venda.status)}</div><div class="grade duas-colunas"><section class="painel"><div class="painel-cabecalho"><h2>Itens da venda</h2><span class="muted">${venda.itens.length} item(ns)</span></div>${venda.itens.map(i => `<div class="linha"><span class="linha-inicio"><span class="icone-caixa roxo">${icone('produtos')}</span><span><strong>${esc(i.descricao || nomes.get(i.produto_id) || 'Produto #' + i.produto_id)}</strong><small>${i.quantidade} unidade(s) × ${dinheiro(i.valor_vendido)}</small></span></span><strong>${dinheiro(Math.round(i.valor_vendido * 100) * i.quantidade / 100)}</strong></div>`).join('')}<div class="total"><span>Total da venda</span><strong>${dinheiro(venda.valor_total)}</strong></div></section><div class="pilha"><section class="painel"><h2>Cliente</h2><div class="linha"><span class="linha-inicio"><span class="avatar">${esc(cliente?.nome?.[0] || 'C')}</span><span><strong>${esc(cliente?.nome || 'Cliente #' + venda.cliente_id)}</strong><small>${esc(cliente?.telefone || '')}</small></span></span></div><p class="muted">${esc(cliente?.email || 'Sem e-mail cadastrado')}</p><div class="separador"></div><small>Registrada pelo usuário #${venda.usuario_id}</small></section>${venda.status !== 'cancelado' ? `<section class="painel pilha">${venda.status === 'pendente' ? `<label for="valor-pagamento">Valor recebido (R$)</label><input id="valor-pagamento" type="number" min="0.01" step="0.01" max="${venda.saldo}" value="${venda.saldo.toFixed(2)}"><button class="botao" id="pagar">Registrar pagamento</button>` : '<p class="muted">Pagamento registrado.</p>'}</section>` : '<div class="aviso info">Esta venda foi cancelada. O estoque já foi devolvido, e o registro foi preservado para consulta.</div>'}</div></div>`;

    document.querySelector('#detalhes').insertAdjacentHTML('beforeend', `<div class="grade duas-colunas financeiro-venda"><section class="painel"><h2>Recebimentos</h2><div class="linha"><span>Total recebido</span><strong>${dinheiro(venda.valor_pago)}</strong></div><div class="linha"><span>${venda.status === 'cancelado' ? 'Saldo na data do cancelamento' : 'Saldo a receber'}</span><strong>${dinheiro(venda.saldo)}</strong></div>${venda.status === 'cancelado' && venda.valor_pago > 0 ? '<p class="aviso info">Os recebimentos foram preservados. Eventual devolução deve ser acertada com o cliente; cancelar a venda não realiza estorno.</p>' : ''}${venda.pagamentos.map(p => `<div class="linha"><span>${dataHora(p.data)}</span><strong>${dinheiro(p.valor)}</strong></div>`).join('') || '<p class="muted">Nenhum pagamento recebido.</p>'}<h3>Parcelas mensais</h3>${venda.parcelas.map(p => `<div class="linha"><span><strong>Parcela ${p.numero} · ${esc(p.vencimento.split('-').reverse().join('/'))}</strong><small>${dinheiro(p.valor)} · Recebido: ${dinheiro(p.valor_pago)}</small></span><strong>${p.saldo === 0 ? 'Paga' : 'Saldo: ' + dinheiro(p.saldo)}</strong></div>`).join('') || '<p class="muted">Sem parcelamento.</p>'}${venda.parcelas.length ? '<p class="muted">A entrada fica fora das parcelas. Novos recebimentos quitam as parcelas mais antigas primeiro.</p>' : ''}</section><section class="painel pilha"><h2>Comentários</h2><label class="sr-only" for="comentarios">Comentários da venda</label><textarea id="comentarios" rows="6" maxlength="2000" ${venda.status === 'cancelado' ? 'disabled' : ''}>${esc(venda.comentarios || '')}</textarea>${venda.status !== 'cancelado' ? '<button class="botao secundario" id="salvar-comentarios">Salvar comentários</button>' : ''}</section></div>`);
    document.querySelector('.cabecalho-pagina').insertAdjacentHTML('beforeend', '<button class="botao secundario" id="editar-acoes">Editar venda</button>');
    document.querySelector('#editar-acoes').onclick = () => {
        const dialogo = document.createElement('dialog');
        dialogo.setAttribute('aria-label', 'Editar venda');
        dialogo.innerHTML = `<h2>Editar venda #${venda.id}</h2><div class="pilha" style="margin-top:20px">${venda.status === 'pendente' && venda.valor_pago === 0 && venda.parcelas.length === 0 ? `<a class="botao" href="../nova-venda/nova-venda.html?id=${venda.id}">Alterar cliente e itens</a>` : ''}${venda.status !== 'cancelado' ? '<button class="botao secundario" id="editar-comentarios">Editar comentários</button><button class="botao perigo" id="cancelar-venda">Cancelar venda e preservar histórico</button>' : ''}<button class="botao perigo" id="excluir-venda">Excluir permanentemente</button><button class="botao secundario" data-fechar>Voltar</button></div>`;
        dialogo.querySelector('[data-fechar]').onclick = () => dialogo.close();
        dialogo.querySelector('#editar-comentarios')?.addEventListener('click', () => { dialogo.close(); document.querySelector('#comentarios').focus(); });
        dialogo.querySelector('#excluir-venda').onclick = async () => {
            if (!await confirmarComSenha(`Excluir venda #${venda.id}?`, 'A venda, seus itens, parcelas e histórico de pagamentos serão apagados permanentemente. O estoque será devolvido se ainda não houve cancelamento. Esta ação não devolve dinheiro ao cliente. Deseja continuar?',
                senha_atual => api('/vendas/' + venda.id + '/excluir', { method: 'DELETE', body: { senha_atual } }))) return;
            location.assign('../vendas/vendas.html');
        };
        dialogo.querySelector('#cancelar-venda')?.addEventListener('click', async () => {
            if (!await confirmarComSenha(`Cancelar venda #${venda.id}?`, 'O estoque será devolvido e o histórico preservado. Esta ação não realiza estorno financeiro. Deseja continuar?',
                senha_atual => api('/vendas/' + venda.id, { method: 'DELETE', body: { senha_atual } }), 'Confirmar cancelamento')) return;
            dialogo.close();
            await carregar().catch(erroTela);
            notificar('Venda cancelada.');
        });
        dialogo.addEventListener('close', () => dialogo.remove());
        document.body.append(dialogo);
        dialogo.showModal();
    };
    document.querySelector('#salvar-comentarios')?.addEventListener('click', async e => {
        e.target.disabled = true;
        try {
            await api('/vendas/' + venda.id, { method: 'PATCH', body: { comentarios: document.querySelector('#comentarios').value } });
            notificar('Comentários salvos.');
        } catch (erro) { erroTela(erro); } finally { e.target.disabled = false; }
    });
    document.querySelector('#pagar')?.addEventListener('click', async (evento) => {

        const valor = Number(document.querySelector('#valor-pagamento').value);
        if (!Number.isFinite(valor) || valor <= 0 || valor > venda.saldo || !document.querySelector('#valor-pagamento').reportValidity()) return erroTela(new Error('Informe um valor válido até o saldo da venda.'));
        if (!await confirmar('Confirmar recebimento?', `Registrar ${dinheiro(valor)} recebidos nesta venda?`, 'Registrar pagamento')) return;

        evento.target.disabled = true;

        try {

            await api('/vendas/' + venda.id + '/pagar', { method: 'PATCH', body: { valor } });

            await carregar();

            notificar('Pagamento registrado.');

        } catch (erro) {

            evento.target.disabled = false;

            erroTela(erro);

        }

    });


}

carregar().catch(erro => { document.querySelector('#detalhes').innerHTML = ''; erroTela(erro); });
