import express from "express";

import { loginSuperAdminController, alterarSenhaSuperAdminController } from "../controllers/acesso.controller.js";

import { autenticarSuperAdmin } from "../../middleware/autenticacao.middleware.js";

const rotasAdministracao = express.Router();

rotasAdministracao.post("/login", loginSuperAdminController);

rotasAdministracao.patch("/senha", autenticarSuperAdmin, alterarSenhaSuperAdminController);

export default rotasAdministracao;
