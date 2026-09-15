import rotasAdministracao from "./modules/acesso/routes/administracao.routes.js";

import express from 'express';

import { bancoPronto } from './database/init.js';

import rotasEmpresas from './modules/empresas/routes/empresas.routes.js';

import rotasClientes from './modules/clientes/routes/clientes.routes.js';

import routerUsuario from './modules/usuarios/routes/usuarios.routes.js';

import rotasProdutos from './modules/produtos/routes/produtos.routes.js';

import rotasVendas from './modules/vendas/routes/vendas.routes.js';

import rotasItensVendidos from './modules/itens_vendidos/routes/itensVendidos.routes.js';

const app = express();

app.use(express.json());

app.use(async (_req, res, proximo) => {

    try {

        await bancoPronto;

        proximo();

    } catch {

        res.status(503).json({ mensagem: "Banco indisponível." });

    }

});

app.use("/administracao", rotasAdministracao);

console.log("App iniciado com sucesso!");

app.use("/empresas", rotasEmpresas);

console.log("Rota /empresa iniciada.")

app.use("/clientes", rotasClientes);

console.log("Rota /clientes iniciada.");

app.use("/usuarios", routerUsuario);

console.log("Rota /usuarios iniciada.");

app.use("/produtos", rotasProdutos);

app.use("/vendas", rotasVendas);

app.use("/itens-vendidos", rotasItensVendidos);


export default app;
