import type { Request, Response } from "express";
import db from "../../../database/connection.js";
import { executarSQL, buscarSQL } from "../../vendas/repositories/transacaoVenda.repository.js";

export async function registrarVisita(req: Request, res: Response) {
    const sessao = req.body?.sessao;
    if (typeof sessao !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessao)) {
        return res.status(400).json({ mensagem: "Sessão de visita inválida." });
    }
    try {
        // A chave única evita duplicação inclusive em requisições simultâneas.
        await executarSQL(db, "INSERT OR IGNORE INTO VISITAS(sessao) VALUES (?)", [sessao.toLowerCase()]);
        return res.status(204).end();
    } catch {
        return res.status(503).json({ mensagem: "Não foi possível registrar a visita." });
    }
}

export async function consultarVisitas(_req: Request, res: Response) {
    res.setHeader("Cache-Control", "no-store");
    try {
        const dados = await buscarSQL<{ total: number }>(db, "SELECT COUNT(*) AS total FROM VISITAS");
        return res.json({ dados: { total: dados?.total ?? 0 } });
    } catch {
        return res.status(503).json({ mensagem: "Não foi possível consultar as visitas." });
    }
}
