import type sqlite3 from "sqlite3";

import type { ConexaoBanco, ValorSQL } from "../../../database/conexaoBanco.js";

import { executarTransacaoTurso } from "../../../database/turso.js";

export function executarSQL(conexao: ConexaoBanco, sql: string, valores: ValorSQL[] = []): Promise<{ id: number; alteracoes: number }> {

    return new Promise((resolve, reject) => {

        conexao.run(sql, valores, function (erro) {

            if (erro) {

                return reject(erro);

            }

            resolve({ id: this.lastID, alteracoes: this.changes });

        });

    });

}

export function buscarSQL<T>(conexao: ConexaoBanco, sql: string, valores: ValorSQL[] = []): Promise<T | undefined> {

    return new Promise((resolve, reject) => {

        conexao.get<T>(sql, valores, (erro, registro) => {

            if (erro) {

                return reject(erro);

            }

            resolve(registro);

        });

    });

}

export function listarSQL<T>(conexao: ConexaoBanco, sql: string, valores: ValorSQL[] = []): Promise<T[]> {

    return new Promise((resolve, reject) => {

        conexao.all<T>(sql, valores, (erro, registros) => {

            if (erro) {

                return reject(erro);

            }

            resolve(registros);

        });

    });

}

// Uma conexão exclusiva impede que outras requisições participem da transação.
export async function executarTransacaoVenda<T>(operacao: (conexao: ConexaoBanco) => Promise<T>): Promise<T> {

    if (process.env.TURSO_DATABASE_URL) {

        return executarTransacaoTurso(operacao);

    }

    const { default: sqlite3 } = await import("sqlite3");

    const conexao = await new Promise<sqlite3.Database>((resolve, reject) => {

        const banco = new sqlite3.Database(process.env.SQLITE_PATH || "src/database/database.db", (erro) => {

            if (erro) {

                return reject(erro);

            }

            resolve(banco);

        });

    });

    conexao.configure("busyTimeout", 5000);

    let iniciada = false;

    try {

        await executarSQL(conexao, "PRAGMA foreign_keys = ON");

        await executarSQL(conexao, "BEGIN IMMEDIATE");

        iniciada = true;

        const resultado = await operacao(conexao);

        await executarSQL(conexao, "COMMIT");

        iniciada = false;

        return resultado;

    } catch (erro) {

        if (iniciada) {

            await executarSQL(conexao, "ROLLBACK");

        }

        throw erro;

    } finally {

        await new Promise<void>((resolve, reject) => {

            conexao.close((erro) => {

                if (erro) {

                    return reject(erro);

                }

                resolve();

            });

        });

    }

}
