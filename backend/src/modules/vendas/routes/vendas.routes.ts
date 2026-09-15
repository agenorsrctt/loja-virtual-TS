import express from "express";

import { autenticar } from "../../middleware/autenticacao.middleware.js";

import { criarVendaController } from "../controllers/criarVenda.controller.js";

import { alterarVendaController } from "../controllers/alterarVenda.controller.js";

import { buscarVendaController } from "../controllers/buscarVenda.controller.js";

import { listarVendasController } from "../controllers/listarVendas.controller.js";

import { cancelarVendaController } from "../controllers/cancelarVenda.controller.js";

const rotasVendas = express.Router();

rotasVendas.use(autenticar);

rotasVendas.get("/", listarVendasController);

rotasVendas.get("/:id", buscarVendaController);

rotasVendas.post("/", criarVendaController);

rotasVendas.patch("/:id", alterarVendaController);

rotasVendas.delete("/:id", cancelarVendaController);

export default rotasVendas;
