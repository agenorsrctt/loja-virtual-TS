import "dotenv/config";

import app from "./app.js";

import { bancoPronto } from "./database/init.js";

const PORT = Number(process.env.PORT || 3000);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {

    throw new Error("PORT deve ser uma porta válida entre 1 e 65535.");

}


await bancoPronto;

app.listen(PORT, () => {

    console.log("Servidor iniciado na porta: " + PORT);

});
