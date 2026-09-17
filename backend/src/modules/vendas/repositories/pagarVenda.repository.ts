import type { VendaDetalhadaDTO } from "../dtos/venda.dto.js";

import { executarSQL, executarTransacaoVenda } from "./transacaoVenda.repository.js";

import { buscarVendaNaConexao } from "./buscarVenda.repository.js";

import { ErroVenda } from "../utils/erroVenda.util.js";

export function pagarVendaRepository(empresa_id: number, id: number, valor?: number): Promise<VendaDetalhadaDTO> {

    return executarTransacaoVenda(async (conexao) => {

        const venda = await buscarVendaNaConexao(conexao, empresa_id, id);

        if (venda.status === "cancelado") {

            throw new ErroVenda("Venda cancelada não pode ser paga.", 409);

        }

        if (venda.status === "pago") {
            if (valor !== undefined) throw new ErroVenda("A venda já está quitada.", 409);

            return venda;

        }

        const centavos = Math.round((valor ?? venda.saldo) * 100);
        if (centavos > Math.round(venda.saldo * 100)) throw new ErroVenda("O pagamento supera o saldo da venda.", 400);
        await executarSQL(conexao, "INSERT INTO PAGAMENTOS(venda_id, empresa_id, valor) VALUES(?, ?, ?)", [id, empresa_id, centavos / 100]);
        if (centavos === Math.round(venda.saldo * 100)) await executarSQL(conexao, "UPDATE VENDAS SET status = 'pago' WHERE empresa_id = ? AND id = ?", [empresa_id, id]);
        return await buscarVendaNaConexao(conexao, empresa_id, id);

    });

}
