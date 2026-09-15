import db from "./connection.js";

export async function begin(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        db.run("begin", (erro) => {
            if(erro) {
                return reject(erro)
            }

            resolve();
        });
    })
}

export async function commit(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        db.run("commit", (erro) => {
            if(erro) {
                return reject(erro)
            }

            resolve();
        });
    })
}

export async function rollback(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        db.run("rollback", (erro) => {
            if(erro) {
                return reject(erro)
            }

            resolve();
        });
    })
}
