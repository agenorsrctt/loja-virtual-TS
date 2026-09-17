import type { Request, Response } from "express";
import { executarTransacaoVenda, executarSQL, buscarSQL } from "../vendas/repositories/transacaoVenda.repository.js";
import { devolverEstoqueRepository } from "../itens_vendidos/repositories/devolverEstoque.repository.js";
import { ErroVenda } from "../vendas/utils/erroVenda.util.js";
import { tratarErroVenda } from "../vendas/controllers/tratarErroVenda.controller.js";

type Entidade = 'clientes' | 'produtos' | 'usuarios' | 'empresas' | 'vendas';
const tabelas = { clientes: 'CLIENTES', produtos: 'PRODUTOS', usuarios: 'USUARIOS', empresas: 'EMPRESAS', vendas: 'VENDAS' } as const;

export function excluirController(entidade: Entidade) {
    return async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            if (!Number.isSafeInteger(id) || id <= 0) throw new ErroVenda('Registro inválido.', 400);
            const ator = res.locals.usuario;
            if (entidade === 'empresas' ? !res.locals.superadmin : !ator) throw new ErroVenda('Acesso não permitido.', 403);
            if (entidade === 'usuarios' && !['admin', 'gerente'].includes(ator.tipo)) throw new ErroVenda('Sem permissão para excluir usuários.', 403);
            const empresa = entidade === 'empresas' ? id : ator.empresa_id;
            await executarTransacaoVenda(async c => {
                const filtro = entidade === 'empresas' ? 'id = ?' : 'id = ? AND empresa_id = ?';
                const params = entidade === 'empresas' ? [id] : [id, empresa];
                const registro = await buscarSQL<{status: string; tipo?: string}>(c, `SELECT * FROM ${tabelas[entidade]} WHERE ${filtro}`, params);
                if (!registro) throw new ErroVenda('Registro não encontrado.', 404);
                if (entidade === 'empresas') {
                    // A empresa inteira é removida em uma única transação, na ordem das referências.
                    for (const tabela of ['PAGAMENTOS', 'PARCELAS', 'ITENS_VENDIDOS', 'VENDAS', 'PRODUTOS', 'CLIENTES', 'USUARIOS']) {
                        await executarSQL(c, `DELETE FROM ${tabela} WHERE empresa_id = ?`, [empresa]);
                    }
                } else if (entidade === 'vendas') {
                    if (registro.status !== 'cancelado') await devolverEstoqueRepository(c, empresa, id);
                    for (const tabela of ['PAGAMENTOS', 'PARCELAS', 'ITENS_VENDIDOS']) {
                        await executarSQL(c, `DELETE FROM ${tabela} WHERE venda_id = ? AND empresa_id = ?`, [id, empresa]);
                    }
                } else {
                    const vinculo = entidade === 'produtos'
                        ? await buscarSQL(c, 'SELECT id FROM ITENS_VENDIDOS WHERE produto_id = ? AND empresa_id = ? LIMIT 1', [id, empresa])
                        : await buscarSQL(c, `SELECT id FROM VENDAS WHERE ${entidade === 'clientes' ? 'cliente_id' : 'usuario_id'} = ? AND empresa_id = ? LIMIT 1`, [id, empresa]);
                    if (vinculo) throw new ErroVenda('Este registro está vinculado a vendas. Inative o cadastro para preservar o histórico ou exclua as vendas vinculadas primeiro.', 409);
                    if (entidade === 'usuarios' && registro.tipo === 'admin' && registro.status === 'ativo') {
                        const outro = await buscarSQL(c, "SELECT id FROM USUARIOS WHERE empresa_id = ? AND id != ? AND tipo = 'admin' AND status = 'ativo' LIMIT 1", [empresa, id]);
                        if (!outro) throw new ErroVenda('Não é possível excluir o último administrador ativo da empresa.', 409);
                    }
                }
                await executarSQL(c, `DELETE FROM ${tabelas[entidade]} WHERE ${filtro}`, params);
            });
            return res.status(200).json({ mensagem: 'Registro excluído permanentemente.', dados: { id } });
        } catch (erro) { return tratarErroVenda(erro, res); }
    };
}
