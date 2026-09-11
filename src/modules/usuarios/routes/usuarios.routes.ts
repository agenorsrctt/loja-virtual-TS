import express from "express";
import { criarUsuarioController } from "../controllers/criarUsuarios.controller.js";
import { listarUsuariosController } from "../controllers/listarUsuario.controller.js";
import { buscarUsuarioController } from "../controllers/buscarUsuario.controller.js";

const routerUsuario = express.Router();

routerUsuario.get("/", listarUsuariosController);
routerUsuario.get("/:id", buscarUsuarioController);
routerUsuario.post("/", criarUsuarioController);

export default routerUsuario;