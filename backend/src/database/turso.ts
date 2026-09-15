import { createClient } from "@libsql/client/web";

import type { Client, Transaction } from "@libsql/client";

import type { ConexaoBanco, RetornoEscrita, ValorSQL } from "./conexaoBanco.js";

let cliente: Client | undefined;

export function normalizarErroBanco(erro: unknown): Error {

    const codigo = erro && typeof erro === "object" && "code" in erro ? String(erro.code) : "BANCO_INDISPONIVEL";

    // Não propaga URLs, tokens ou detalhes do provedor aos controladores.
    const normalizado = codigo.startsWith("SQLITE_CONSTRAINT") ? "SQLITE_CONSTRAINT" : codigo.startsWith("SQLITE_BUSY") || codigo === "SQLITE_LOCKED" ? "SQLITE_BUSY" : codigo;

    return Object.assign(new Error("Não foi possível executar a operação no banco."), { code: normalizado });

}

export function clienteTurso(): Client {

    if (cliente) return cliente;

    const url = process.env.TURSO_DATABASE_URL?.trim();

    const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

    if (!url || !authToken || !/^(libsql|https):\/\//.test(url)) {

        throw new Error("Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN para acessar o Turso.");

    }

    cliente = createClient({ url, authToken, intMode: "number" });

    return cliente;

}

// Mantém o contrato dos repositórios existentes usando o driver remoto do Turso.
export class BancoTurso implements ConexaoBanco {

    constructor(private readonly executor: Pick<Client, "execute" | "close">) {

    }

    run(sql: string, valores: ValorSQL[], retorno: (this: RetornoEscrita, erro: Error | null) => void): void {

        this.executor.execute({ sql, args: valores }).then(resultado => {

            retorno.call({ lastID: Number(resultado.lastInsertRowid ?? 0), changes: resultado.rowsAffected }, null);

        }, erro => retorno.call({ lastID: 0, changes: 0 }, normalizarErroBanco(erro)));

    }

    get<T>(sql: string, valores: ValorSQL[], retorno: (erro: Error | null, registro: T | undefined) => void): void {

        this.executor.execute({ sql, args: valores }).then(resultado => {

            retorno(null, resultado.rows[0] ? { ...resultado.rows[0] } as T : undefined);

        }, erro => retorno(normalizarErroBanco(erro), undefined));

    }

    all<T>(sql: string, valores: ValorSQL[], retorno: (erro: Error | null, registros: T[]) => void): void {

        this.executor.execute({ sql, args: valores }).then(resultado => {

            retorno(null, resultado.rows.map(registro => ({ ...registro }) as T));

        }, erro => retorno(normalizarErroBanco(erro), []));

    }

    close(retorno: (erro: Error | null) => void): void {

        this.executor.close();

        retorno(null);

    }

}

export async function executarTransacaoTurso<T>(operacao: (conexao: ConexaoBanco) => Promise<T>, banco = clienteTurso()): Promise<T> {

    let transacao: Transaction | undefined;

    try {

        transacao = await banco.transaction("write");

        const resultado = await operacao(new BancoTurso(transacao));

        await transacao.commit();

        return resultado;

    } catch (erro) {

        if (transacao && !transacao.closed) {

            await transacao.rollback().catch(() => {});

        }

        if (erro instanceof Error && "status" in erro) throw erro;

        throw normalizarErroBanco(erro);

    } finally {

        transacao?.close();

    }

}
