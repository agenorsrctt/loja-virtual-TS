import db from "./connection.js";

db.serialize(() => {


    db.run(`CREATE TABLE IF NOT EXISTS EMPRESAS(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa TEXT NOT NULL,
        cnpj TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL
        )`),

        db.run(`CREATE TABLE IF NOT EXISTS USUARIOS(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        email TEXT NOT NULL,
        status TEXT NOT NULL,
        senha TEXT NOT NULL,
        primeiro_acesso BOOLEAN NOT NULL DEFAULT FALSE,
        FOREIGN KEY (empresa_id) references EMPRESAS(id),
        UNIQUE (empresa_id, email)
        )`),


        db.run(`CREATE TABLE IF NOT EXISTS CLIENTES(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        email TEXT,
        telefone TEXT NOT NULL,
        status TEXT NOT NULL,
        senha TEXT NOT NULL,
        FOREIGN KEY (empresa_id) references EMPRESAS(id),
        UNIQUE (empresa_id, email),
        UNIQUE (empresa_id, telefone)
        )`),

        db.run(`CREATE TABLE IF NOT EXISTS PRODUTOS(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa_id INTEGER NOT NULL,
        produto TEXT NOT NULL,
        estoque INTEGER NOT NULL,
        preco REAL NOT NULL,
        categoria TEXT,
        codigo TEXT,
        status TEXT NOT NULL,
        FOREIGN KEY (empresa_id) references EMPRESAS(id)
        )`),

        db.run(`CREATE TABLE IF NOT EXISTS VENDAS(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empresa_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        cliente_id INTEGER NOT NULL,
        data DATETIME DEFAULT CURRENT_TIMESTAMP,
        valor_total REAL NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (empresa_id) references EMPRESAS(id),
        FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id),
        FOREIGN KEY (cliente_id) REFERENCES CLIENTES(id)
        )`),

        db.run(`CREATE TABLE IF NOT EXISTS ITENS_VENDIDOS(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venda_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        empresa_id INTEGER NOT NULL,
        valor_vendido REAL NOT NULL,
        quantidade INTEGER NOT NULL,
        FOREIGN KEY (produto_id) REFERENCES PRODUTOS(id),
        FOREIGN KEY (venda_id) REFERENCES VENDAS(id),
        FOREIGN KEY (empresa_id) references EMPRESAS(id)
        )`);

});

export default db;