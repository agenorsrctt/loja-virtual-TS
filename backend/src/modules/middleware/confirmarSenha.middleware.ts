import type { Request, Response, NextFunction } from "express";
import { buscarSuperAdmin, buscarContaEmpresa } from "../acesso/repositories/acesso.repository.js";
import { verificarSenha } from "./senha.util.js";

export async function confirmarSenha(req: Request, res: Response, next: NextFunction) {
    const senha = req.body?.senha_atual;
    if (typeof senha !== 'string' || !senha.trim() || Buffer.byteLength(senha, 'utf8') > 72) {
        return res.status(400).json({ mensagem: 'Informe sua senha atual para confirmar.' });
    }
    try {
        const ator = res.locals.usuario;
        const conta = res.locals.superadmin ? await buscarSuperAdmin() : ator ? await buscarContaEmpresa(ator.empresa_id, ator.id) : undefined;
        if (!conta || !await verificarSenha(senha, conta.senha)) {
            return res.status(403).json({ mensagem: 'Senha atual incorreta. Nenhum registro foi excluído.' });
        }
        return next();
    } catch {
        return res.status(500).json({ mensagem: 'Não foi possível confirmar a senha.' });
    }
}
