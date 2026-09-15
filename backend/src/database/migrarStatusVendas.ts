import { executarSQL, executarTransacaoVenda } from "../modules/vendas/repositories/transacaoVenda.repository.js";

export async function migrarStatusVendas(): Promise<void> {

    await executarTransacaoVenda(async (conexao) => {

        await executarSQL(conexao, "UPDATE VENDAS SET status = 'pendente' WHERE status = 'concluida'");

        await executarSQL(conexao, "UPDATE VENDAS SET status = 'cancelado' WHERE status = 'cancelada'");

    });

}
