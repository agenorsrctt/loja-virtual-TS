import express from 'express';
import { criarClienteController } from '../controllers/criarCliente.controller.js';
import { listarClienteController } from '../controllers/listaCliente.controller.js';
import { buscarClienteController } from '../controllers/buscarCliente.controller.js';
import { alterarClienteController } from '../controllers/alterarCliente.controller.js';
import { inativarClienteController } from '../controllers/inativarCliente.controller.js';
import { autenticar } from '../../middleware/jwt.js';

const clienteRouter = express.Router();

clienteRouter.get("/", autenticar ,listarClienteController);
clienteRouter.get("/:id", autenticar , buscarClienteController);

clienteRouter.post("/", autenticar , criarClienteController);

clienteRouter.patch("/:id", autenticar , alterarClienteController);
clienteRouter.delete("/:id", autenticar , inativarClienteController);

export default clienteRouter;