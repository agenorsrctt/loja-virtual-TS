import express from "express";

import { autenticar } from "../../middleware/autenticacao.middleware.js";

import { criarProdutoController } from "../controllers/criarProduto.controller.js";

import { listarProdutoController } from "../controllers/listarProduto.controller.js";

import { buscarProdutoController } from "../controllers/buscarProduto.controller.js";

import { alterarProdutoController } from "../controllers/alterarProduto.controller.js";

import { inativarProdutoController } from "../controllers/inativarProduto.controller.js";

const produtoRouter = express.Router();

produtoRouter.use(autenticar);

produtoRouter.get("/", listarProdutoController);

produtoRouter.get("/:id", buscarProdutoController);

produtoRouter.post("/", criarProdutoController);

produtoRouter.patch("/:id", alterarProdutoController);

produtoRouter.delete("/:id", inativarProdutoController);

export default produtoRouter;
