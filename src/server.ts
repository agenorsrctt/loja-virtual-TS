import "dotenv/config";
import app from "./app.js";

const PORT: number = 3000;
console.log(process.env.JWT_SECRET);

app.listen(PORT, () => {
    console.log("Servidor iniciado na porta: " + PORT);
});

