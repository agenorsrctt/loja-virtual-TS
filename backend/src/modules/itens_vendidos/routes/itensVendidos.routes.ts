import express from "express";

import { autenticar } from "../../middleware/autenticacao.middleware.js";

import { listarItensVendidosController } from "../controllers/listarItensVendidos.controller.js";

import { buscarItemVendidoController } from "../controllers/buscarItemVendido.controller.js";

const rotasItensVendidos = express.Router();

rotasItensVendidos.use(autenticar);

rotasItensVendidos.get("/", listarItensVendidosController);

rotasItensVendidos.get("/:id", buscarItemVendidoController);

export default rotasItensVendidos;
