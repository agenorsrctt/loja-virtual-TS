import { api, registros } from '../compartilhado/api.js';

import { iniciar, dinheiro, icone, esc, dataHora, dataVenda, estado, erroTela } from '../compartilhado/interface.js';

async function carregar() {

    const atual = await iniciar('dashboard', 'Dashboard');

    if (!atual) return;

    document.querySelector('#saudacao').textContent = `Olá, ${atual.perfil.nome.split(' ')[0]}!`;

    const [rv, rc, rp] = await Promise.all([api('/vendas'), api('/clientes'), api('/produtos')]);

    const vendas = registros(rv);

    const clientes = registros(rc);

    const produtos = registros(rp);

    const nomes = new Map(clientes.map(c => [c.id, c.nome]));

    const validas = vendas.filter(v => v.status !== 'cancelado').flatMap(v => v.pagamentos || []);

    const hoje = new Date();

    const mesmoDia = (a, b) => a.toDateString() === b.toDateString();

    const soma = lista => lista.reduce((total, v) => total + Math.round(v.valor * 100), 0) / 100;

    const hojeVendas = validas.filter(v => mesmoDia(dataVenda(v.data), hoje));

    const mes = validas.filter(v => dataVenda(v.data).getMonth() === hoje.getMonth() && dataVenda(v.data).getFullYear() === hoje.getFullYear());

    const baixo = produtos.filter(p => p.status === 'ativo' && p.estoque <= 5);

    const metricas = [['Recebido hoje', dinheiro(soma(hojeVendas)), `${hojeVendas.length} recebimento(s)`, 'vendas', 'verde'], ['Clientes ativos', clientes.filter(c => c.status === 'ativo').length, 'Conexões que geram negócios', 'clientes', 'azul'], ['Produtos ativos', produtos.filter(p => p.status === 'ativo').length, `${baixo.length} com estoque baixo`, 'produtos', 'roxo'], ['Recebido neste mês', dinheiro(soma(mes)), `${mes.length} recebimento(s) no período`, 'dinheiro', 'laranja']];

    const dias = Array.from({ length: 7 }, (_, i) => {

        const data = new Date(hoje);

        data.setDate(hoje.getDate() - 6 + i);

        return { data, valor: soma(validas.filter(v => mesmoDia(dataVenda(v.data), data))) };

    });

    const maximo = Math.max(1, ...dias.map(d => d.valor));

    document.querySelector('#dados-dashboard').innerHTML = `<div class="grade metricas">${metricas.map(([titulo, valor, legenda, icon, cor]) => `<article class="metrica"><span class="icone-caixa ${cor}">${icone(icon)}</span><p>${titulo}</p><strong>${valor}</strong><small>${legenda}</small></article>`).join('')}</div><div class="grade duas-colunas"><div class="pilha"><section class="painel"><div class="painel-cabecalho"><div><h2>Ações rápidas</h2><p>O próximo passo está a um toque.</p></div></div><div class="acoes-rapidas">${[['clientes/clientes.html?novo=1', 'clientes', 'Novo cliente', 'verde'], ['produtos/produtos.html?novo=1', 'produtos', 'Novo produto', 'azul'], ['nova-venda/nova-venda.html', 'vendas', 'Nova venda', 'laranja'], ['vendas/vendas.html', 'dinheiro', 'Ver vendas', 'roxo']].map(([link, icon, label, cor]) => `<a class="acao-rapida" href="../${link}"><span class="icone-caixa ${cor}">${icone(icon)}</span>${label}</a>`).join('')}</div></section><section class="painel"><div class="painel-cabecalho"><div><h2>Vendas recentes</h2><p>As últimas movimentações da sua empresa.</p></div><a href="../vendas/vendas.html">Ver todas →</a></div>${vendas.length ? vendas.slice(0, 5).map(v => `<a class="linha" href="../detalhes-venda/detalhes-venda.html?id=${v.id}"><span class="linha-inicio"><span class="icone-caixa ${v.status === 'cancelado' ? 'roxo' : 'verde'}">${icone('vendas')}</span><span><strong>Venda #${v.id}</strong><small>${esc(nomes.get(v.cliente_id) || 'Cliente #' + v.cliente_id)}</small></span></span><span class="linha-fim"><strong style="color:${v.status === 'cancelado' ? '#8f99a8' : 'var(--verde)'}">${dinheiro(v.valor_total)}</strong><small>${{ pendente: 'Pendente', pago: 'Pago', cancelado: 'Cancelado' }[v.status]} · ${dataHora(v.data)}</small></span></a>`).join('') : estado('Sua próxima conquista começa aqui', 'Cadastre um cliente e adicione itens para fazer sua primeira venda.')}</section></div><div class="pilha"><section class="painel"><div class="painel-cabecalho"><div><h2>Ritmo de vendas</h2><p>Últimos 7 dias · recebimentos de vendas não canceladas</p></div><span class="icone-caixa azul">${icone('calendario')}</span></div><strong class="total-semana">${dinheiro(dias.reduce((s, d) => s + d.valor, 0))}</strong><div class="grafico" role="img" aria-label="${esc(dias.map(d => `${d.data.toLocaleDateString('pt-BR')}: ${dinheiro(d.valor)}`).join('; '))}">${dias.map(d => `<div class="barra-coluna" title="${dinheiro(d.valor)}"><div class="barra" style="height:${Math.max(2, d.valor / maximo * 140)}px"></div><small>${d.data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</small></div>`).join('')}</div></section><section class="painel"><div class="painel-cabecalho"><h2>De olho no estoque</h2><span class="etiqueta laranja">${baixo.length} alerta(s)</span></div>${baixo.length ? baixo.slice(0, 3).map(p => `<a class="linha" href="../produtos/produtos.html?estoque=baixo"><span><strong>${esc(p.produto)}</strong><small>Hora de planejar a reposição</small></span><span class="etiqueta laranja">${p.estoque} un.</span></a>`).join('') : '<p class="muted">Tudo em dia. Nenhum produto ativo com estoque baixo.</p>'}<a class="link-estoque" href="../produtos/produtos.html">Gerenciar produtos →</a></section></div></div>`;

}

carregar().catch(erro => { document.querySelector('#dados-dashboard').innerHTML = ''; erroTela(erro); });
