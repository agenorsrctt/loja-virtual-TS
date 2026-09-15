import { config } from "dotenv";

// Arquivo separado para nunca trocar o banco local sem intenção.
config({ path: ".env.turso", override: true, quiet: true });

if (!process.env.TURSO_DATABASE_URL?.trim() || !process.env.TURSO_AUTH_TOKEN?.trim()) {

    throw new Error("Preencha backend/.env.turso com TURSO_DATABASE_URL e TURSO_AUTH_TOKEN.");

}
