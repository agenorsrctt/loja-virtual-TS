import type { VendaDTO, VendaDetalhadaDTO } from "../dtos/venda.dto.js";
import { listarSQL, executarTransacaoVenda } from "./transacaoVenda.repository.js";

type Pagamento = VendaDetalhadaDTO['pagamentos'][number] & {venda_id: number};
export function listarVendasRepository(empresa_id: number) {
    return executarTransacaoVenda(async conexao => {
        const vendas = await listarSQL<VendaDTO>(conexao, "SELECT * FROM VENDAS WHERE empresa_id = ? ORDER BY id DESC", [empresa_id]);
        const pagamentos = await listarSQL<Pagamento>(conexao, "SELECT id, venda_id, valor, data FROM PAGAMENTOS WHERE empresa_id = ? ORDER BY id", [empresa_id]);
        const porVenda = new Map<number, Pagamento[]>();
        for (const pagamento of pagamentos) {
            const lista = porVenda.get(pagamento.venda_id) ?? [];
            lista.push(pagamento);
            porVenda.set(pagamento.venda_id, lista);
        }
        return vendas.map(venda => {
            const recebimentos = porVenda.get(venda.id) ?? [];
            const centavos = recebimentos.reduce((s, p) => s + Math.round(p.valor * 100), 0);
            return {...venda, pagamentos: recebimentos, valor_pago: centavos / 100, saldo: (Math.round(venda.valor_total * 100) - centavos) / 100};
        });
    });
}
