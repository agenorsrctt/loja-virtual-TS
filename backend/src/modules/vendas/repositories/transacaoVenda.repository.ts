import sqlite3 from "sqlite3";

type ValorSQL = string | number | null;

export function executarSQL(conexao: sqlite3.Database, sql: string, valores: ValorSQL[] = []): Promise<{ id: number; alteracoes: number }> {

    return new Promise((resolve, reject) => {

        conexao.run(sql, valores, function (erro) {

            if (erro) {

                return reject(erro);

            }

            resolve({ id: this.lastID, alteracoes: this.changes });

        });

    });

}

export function buscarSQL<T>(conexao: sqlite3.Database, sql: string, valores: ValorSQL[] = []): Promise<T | undefined> {

    return new Promise((resolve, reject) => {

        conexao.get<T>(sql, valores, (erro, registro) => {

            if (erro) {

                return reject(erro);

            }

            resolve(registro);

        });

    });

}

export function listarSQL<T>(conexao: sqlite3.Database, sql: string, valores: ValorSQL[] = []): Promise<T[]> {

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
export async function executarTransacaoVenda<T>(operacao: (conexao: sqlite3.Database) => Promise<T>): Promise<T> {

    const conexao = await new Promise<sqlite3.Database>((resolve, reject) => {

        const banco = new sqlite3.Database("src/database/database.db", (erro) => {

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
