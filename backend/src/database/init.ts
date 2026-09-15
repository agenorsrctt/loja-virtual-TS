import db from "./connection.js";

import { prepararBanco, verificarBanco } from "./esquema.js";

// Na Vercel, a inicialização apenas confere a versão. Migrações são executadas
// explicitamente antes da publicação, sem DDL a cada nova instância da API.
export const bancoPronto = process.env.VERCEL ? verificarBanco() : prepararBanco();

// A API retorna 503 se a inicialização falhar, sem rejeição não observada.
bancoPronto.catch(() => {});

export default db;
