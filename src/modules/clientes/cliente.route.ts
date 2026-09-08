import express from 'express';
import { criarClienteController } from './cliente.controller.js';

const clienteRouter = express.Router();

clienteRouter.post("/", criarClienteController);

export default clienteRouter;