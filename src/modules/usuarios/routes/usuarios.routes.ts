import express from "express";
import { criarUsuarioController } from "../controllers/criarUsuarios.controller.js";
import { listarUsuariosController } from "../controllers/listarUsuario.controller.js";
import { buscarUsuarioController } from "../controllers/buscarUsuario.controller.js";

const routerUsuario = express.Router();

routerUsuario.get("/", buscarUsuarioController);
routerUsuario.get("/:id", listarUsuariosController);
routerUsuario.post("/", criarUsuarioController);

export default routerUsuario;