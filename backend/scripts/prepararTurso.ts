import "./carregarAmbienteTurso.js";

const { default: db } = await import("../src/database/connection.js");

try {

    const { prepararBanco, verificarBanco } = await import("../src/database/esquema.js");

    await prepararBanco();

    await verificarBanco();

    console.log("Turso preparado. Tabelas e migrações verificadas sem apagar cadastros existentes.");

} catch {

    console.error("Não foi possível preparar o Turso. Confira URL, token e conexão e execute novamente.");

    process.exitCode = 1;

} finally {

    await new Promise<void>((resolve, reject) => db.close(erro => erro ? reject(erro) : resolve()));

}
