import type sqlite3 from "sqlite3";

import { buscarSQL } from "./transacaoVenda.repository.js";

import { ErroVenda } from "../utils/erroVenda.util.js";

export async function validarParticipantesVendaRepository(conexao: sqlite3.Database, empresa_id: number, usuario_id: number, cliente_id: number): Promise<void> {

    const empresa = await buscarSQL<{ status: string }>(conexao, "SELECT status FROM EMPRESAS WHERE id = ?", [empresa_id]);

    if (!empresa || empresa.status !== "ativo") {

        throw new ErroVenda("Empresa inexistente ou inativa.", 409);

    }

    const usuario = await buscarSQL<{ status: string }>(conexao,
        "SELECT status FROM USUARIOS WHERE empresa_id = ? AND id = ?", [empresa_id, usuario_id]);

    if (!usuario || usuario.status !== "ativo") {

        throw new ErroVenda("Usuário inexistente ou inativo.", 409);

    }

    const cliente = await buscarSQL<{ status: string }>(conexao,
        "SELECT status FROM CLIENTES WHERE empresa_id = ? AND id = ?", [empresa_id, cliente_id]);

    if (!cliente) {

        throw new ErroVenda("Cliente não encontrado.", 404);

    }

    if (cliente.status !== "ativo") {

        throw new ErroVenda("Cliente inativo.", 409);

    }

}
