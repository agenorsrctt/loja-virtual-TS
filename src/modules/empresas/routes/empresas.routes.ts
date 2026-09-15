import express from "express";

import { autenticar } from "../../middleware/autenticacao.middleware.js";

import { criarEmpresaController } from "../controllers/criarEmpresa.controller.js";

import { listarEmpresasController } from "../controllers/listarEmpresas.controller.js";

import { buscarEmpresaController } from "../controllers/buscarEmpresa.controller.js";

import { alterarEmpresaController } from "../controllers/alterarEmpresa.controller.js";

import { inativarEmpresaController } from "../controllers/inativarEmpresa.controller.js";

const rotasEmpresas = express.Router();

rotasEmpresas.use(autenticar);

rotasEmpresas.get("/", listarEmpresasController);

rotasEmpresas.get("/:id", buscarEmpresaController);

rotasEmpresas.post("/", criarEmpresaController);

rotasEmpresas.patch("/:id", alterarEmpresaController);

rotasEmpresas.delete("/:id", inativarEmpresaController);

export default rotasEmpresas;
