import express from 'express';
import { criarClienteController } from '../controllers/criarCliente.controller.js';

const clienteRouter = express.Router();

clienteRouter.post("/", criarClienteController);

export default clienteRouter;