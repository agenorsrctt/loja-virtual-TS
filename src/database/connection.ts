import sqlite3 from 'sqlite3';
const db = new sqlite3.Database("src/database/database.db", (erro) => {
    if (erro) {
        console.log("Erro ao iniciar banco de dados: " + erro);
    }
    console.log("Banco de dados ativo.")
});

db.run("PRAGMA foreign_keys = ON");

export default db;