import express from 'express';
import './database/init.js'
import empresaRouter from './modules/empresas/routes/empresaRouter.js';
import rotasClientes from './modules/clientes/routes/clientes.routes.js';
import routerUsuario from './modules/usuarios/routes/usuarios.routes.js';

const app = express();
app.use(express.json());

console.log("App iniciado com sucesso!");

app.use("/empresas", empresaRouter);
console.log("Rota /empresa iniciada.")

app.use("/clientes", rotasClientes);
console.log("Rota /clientes iniciada.");

app.use("/usuarios", routerUsuario);
console.log("Rota /usuarios iniciada.");


export default app;