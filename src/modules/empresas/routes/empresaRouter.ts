import express from 'express';
import { criarEmpresaController } from '../controllers/criarEmpresa.controller.js';
import { listarEmpresasController } from '../controllers/listarEmpresa.controller.js';
import { buscarEmpresaController } from '../controllers/buscarEmpresa.controller.js';
import { alterarEmpresaController } from '../controllers/alterarEmpresa.controller.js';
import { invativarEmpresaController } from '../controllers/invativarEmpresa.controller.js';

const empresaRouter = express.Router();

empresaRouter.get("/", listarEmpresasController);
empresaRouter.get("/:id", buscarEmpresaController);
empresaRouter.post("/", criarEmpresaController);
empresaRouter.patch("/:id", alterarEmpresaController);
empresaRouter.delete("/:id", invativarEmpresaController);

console.log("Empresa Routes iniciado!");


export default empresaRouter;