import express from 'express';
import { criarEmpresaController } from '../controllers/criarEmpresa.controller.js';
import { listarEmpresasController } from '../controllers/listarEmpresa.controller.js';
import { buscarEmpresaController } from '../controllers/buscarEmpresa.controller.js';
import { alterarEmpresaController } from '../controllers/alterarEmpresa.controller.js';
import { invativarEmpresaController } from '../controllers/invativarEmpresa.controller.js';
import { autenticar } from '../../middleware/jwt.js';

const empresaRouter = express.Router();

empresaRouter.get("/", autenticar , listarEmpresasController);
empresaRouter.get("/:id", autenticar , buscarEmpresaController);
empresaRouter.post("/", autenticar , criarEmpresaController);
empresaRouter.patch("/:id", autenticar , alterarEmpresaController);
empresaRouter.delete("/:id", autenticar , invativarEmpresaController);

console.log("Empresa Routes iniciado!");


export default empresaRouter;