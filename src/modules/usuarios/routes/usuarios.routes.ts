import express from "express";
import { criarUsuarioController } from "../controllers/criarUsuarios.controller.js";
import { listarUsuariosController } from "../controllers/listarUsuario.controller.js";
import { buscarUsuarioController } from "../controllers/buscarUsuario.controller.js";
import { alterarUsuarioController } from "../controllers/alterarUsuario.controller.js";
import { loginUsuarioController } from "../controllers/loginUsuario.controller.js";
import { autenticar } from "../../middleware/autenticacao.middleware.js";
import { inativarUsuarioController } from "../controllers/inativarUsuario.controller.js";

const routerUsuario = express.Router();

routerUsuario.post("/login", loginUsuarioController )
routerUsuario.get("/", autenticar, listarUsuariosController);
routerUsuario.get("/:id", autenticar, buscarUsuarioController);
routerUsuario.post("/", autenticar, criarUsuarioController);
routerUsuario.patch("/:id", autenticar, alterarUsuarioController);
routerUsuario.delete("/:id", autenticar, inativarUsuarioController);

export default routerUsuario;