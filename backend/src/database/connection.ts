import sqlite3 from 'sqlite3';

import { BancoTurso, clienteTurso } from './turso.js';

import type { ConexaoBanco } from './conexaoBanco.js';

if (process.env.VERCEL && !process.env.TURSO_DATABASE_URL) {

    throw new Error("Configure o Turso antes de publicar na Vercel.");

}

const db: ConexaoBanco = process.env.TURSO_DATABASE_URL ? new BancoTurso(clienteTurso()) : new sqlite3.Database(process.env.SQLITE_PATH || "src/database/database.db");

if (!process.env.TURSO_DATABASE_URL) {

    db.run("PRAGMA foreign_keys = ON", [], erro => {

        if (erro) console.error("Não foi possível ativar a integridade do banco local.");

    });

}

export default db;
