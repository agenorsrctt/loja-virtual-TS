import express from "express";

import { perfilSuperAdminController } from "../controllers/perfil.controller.js";

import { loginSuperAdminController, alterarSenhaSuperAdminController } from "../controllers/acesso.controller.js";

import { autenticarSuperAdmin } from "../../middleware/autenticacao.middleware.js";

const rotasAdministracao = express.Router();

rotasAdministracao.get("/perfil", autenticarSuperAdmin, perfilSuperAdminController);

rotasAdministracao.post("/login", loginSuperAdminController);

rotasAdministracao.patch("/senha", autenticarSuperAdmin, alterarSenhaSuperAdminController);

export default rotasAdministracao;
