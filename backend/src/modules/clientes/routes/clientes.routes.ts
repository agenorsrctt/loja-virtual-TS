import { confirmarSenha } from "../../middleware/confirmarSenha.middleware.js";
import { excluirController } from "../../exclusao/excluir.controller.js";
import express from "express";

import { autenticar } from "../../middleware/autenticacao.middleware.js";

import { criarClienteController } from "../controllers/criarCliente.controller.js";

import { listarClientesController } from "../controllers/listarClientes.controller.js";

import { buscarClienteController } from "../controllers/buscarCliente.controller.js";

import { alterarClienteController } from "../controllers/alterarCliente.controller.js";

import { inativarClienteController } from "../controllers/inativarCliente.controller.js";

const rotasClientes = express.Router();

rotasClientes.use(autenticar);

rotasClientes.get("/", listarClientesController);

rotasClientes.get("/:id", buscarClienteController);

rotasClientes.post("/", criarClienteController);

rotasClientes.patch("/:id", alterarClienteController);

rotasClientes.delete("/:id", confirmarSenha, inativarClienteController);

rotasClientes.delete("/:id/excluir", confirmarSenha, excluirController("clientes"));

export default rotasClientes;
