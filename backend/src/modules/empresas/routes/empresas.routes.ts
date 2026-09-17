import { confirmarSenha } from "../../middleware/confirmarSenha.middleware.js";
import { excluirController } from "../../exclusao/excluir.controller.js";
import express from "express";

import { autenticarSuperAdmin } from "../../middleware/autenticacao.middleware.js";

import { criarEmpresaController } from "../controllers/criarEmpresa.controller.js";

import { listarEmpresasController } from "../controllers/listarEmpresas.controller.js";

import { buscarEmpresaController } from "../controllers/buscarEmpresa.controller.js";

import { alterarEmpresaController } from "../controllers/alterarEmpresa.controller.js";

import { inativarEmpresaController } from "../controllers/inativarEmpresa.controller.js";

const rotasEmpresas = express.Router();

rotasEmpresas.use(autenticarSuperAdmin);

rotasEmpresas.get("/", listarEmpresasController);

rotasEmpresas.get("/:id", buscarEmpresaController);

rotasEmpresas.post("/", criarEmpresaController);

rotasEmpresas.patch("/:id", alterarEmpresaController);

rotasEmpresas.delete("/:id", confirmarSenha, inativarEmpresaController);

rotasEmpresas.delete("/:id/excluir", confirmarSenha, excluirController("empresas"));

export default rotasEmpresas;
