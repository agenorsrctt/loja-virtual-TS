import db from "./connection.js";
import { prepararBanco, verificarBanco } from "./esquema.js";

// Na Vercel apenas consulta a versão; migrações continuam sendo explícitas.
export let bancoPronto = process.env.VERCEL ? verificarBanco() : prepararBanco();
let proximaTentativa = Infinity;
function observarFalha() {
    bancoPronto.catch(() => { proximaTentativa = Date.now() + 5000; });
}
observarFalha();

// Uma instância que iniciou antes da migração pode se recuperar sem reinício.
// Requisições simultâneas compartilham a verificação; falhas têm intervalo mínimo.
export function garantirBancoPronto(): Promise<void> {
    if (process.env.VERCEL && Date.now() >= proximaTentativa) {
        proximaTentativa = Infinity;
        bancoPronto = verificarBanco();
        observarFalha();
    }
    return bancoPronto;
}

export default db;
