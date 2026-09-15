import type { Response } from "express";

import { ErroVenda } from "../utils/erroVenda.util.js";

export function tratarErroVenda(erro: unknown, res: Response) {

    if (erro instanceof ErroVenda) {

        return res.status(erro.status).json({ mensagem: erro.message });

    }

    if (erro && typeof erro === "object" && "code" in erro && erro.code === "SQLITE_BUSY") {

        return res.status(409).json({ mensagem: "Banco ocupado. Tente novamente." });

    }

    console.error("Erro na operação de venda:", erro);

    return res.status(500).json({ mensagem: "Erro interno do servidor." });

}
