import { api, registros } from '../compartilhado/api.js';

import { iniciar, esc, dinheiro, dataHora, dataVenda, etiqueta, estado, erroTela } from '../compartilhado/interface.js';

async function carregar() {

    if (!await iniciar('vendas', 'Vendas')) return;

    const [rv, rc] = await Promise.all([api('/vendas'), api('/clientes')]);

    const vendas = registros(rv);

    const clientes = new Map(registros(rc).map(c => [c.id, c.nome]));

    let pagina = 1;

    function desenhar() {

        const busca = document.querySelector('#busca').value.toLowerCase();

        const status = document.querySelector('#status').value;

        const periodo = document.querySelector('#periodo').value;

        const hoje = new Date();

        const lista = vendas.filter(v => {

            const data = dataVenda(v.data);

            return (!status || v.status === status) && `${v.id} ${clientes.get(v.cliente_id) || ''}`.toLowerCase().includes(busca) && (!periodo || (periodo === 'hoje' ? data.toDateString() === hoje.toDateString() : data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear()));

        });

        const paginas = Math.max(1, Math.ceil(lista.length / 10));

        pagina = Math.min(pagina, paginas);

        const alvo = document.querySelector('#lista-vendas');

        if (!lista.length) {

            alvo.innerHTML = estado('Nenhuma venda encontrada', 'Faça uma nova venda ou experimente outro filtro.', '<a class="botao" href="../nova-venda/nova-venda.html">Nova venda</a>');

            return;

        }

        alvo.innerHTML = `<div class="tabela-wrap"><table class="tabela-responsiva"><thead><tr><th>Venda / cliente</th><th>Data</th><th>Total</th><th>Status</th><th>Detalhes</th></tr></thead><tbody>${lista.slice((pagina - 1) * 10, pagina * 10).map(v => `<tr><td><strong>#${v.id}</strong><small>${esc(clientes.get(v.cliente_id) || 'Cliente #' + v.cliente_id)}</small></td><td data-label="Data">${dataHora(v.data)}</td><td data-label="Total"><strong>${dinheiro(v.valor_total)}</strong></td><td data-label="Status">${etiqueta(v.status)}</td><td><a class="botao fantasma" href="../detalhes-venda/detalhes-venda.html?id=${v.id}">Ver detalhes →</a></td></tr>`).join('')}</tbody></table></div><div class="paginacao"><small>${lista.length} venda(s) · Página ${pagina} de ${paginas}</small><div><button class="botao secundario" id="anterior" ${pagina === 1 ? 'disabled' : ''}>Anterior</button><button class="botao secundario" id="proximo" ${pagina === paginas ? 'disabled' : ''}>Próxima</button></div></div>`;

        alvo.querySelector('#anterior').onclick = () => { pagina--; desenhar(); };

        alvo.querySelector('#proximo').onclick = () => { pagina++; desenhar(); };

    }

    document.querySelectorAll('.filtros input, .filtros select').forEach(el => el.addEventListener('input', () => { pagina = 1; desenhar(); }));

    desenhar();

}

carregar().catch(erro => { document.querySelector('#lista-vendas').innerHTML = ''; erroTela(erro); });
