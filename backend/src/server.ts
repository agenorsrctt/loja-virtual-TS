import "dotenv/config";

import app from "./app.js";

import { bancoPronto } from "./database/init.js";

const PORT: number = 3000;


await bancoPronto;

app.listen(PORT, () => {

    console.log("Servidor iniciado na porta: " + PORT);

});

