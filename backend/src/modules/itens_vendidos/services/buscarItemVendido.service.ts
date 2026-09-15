import { buscarItemVendidoRepository } from "../repositories/buscarItemVendido.repository.js";

import { validarIdVenda } from "../../vendas/utils/validarVenda.util.js";

import { ErroVenda } from "../../vendas/utils/erroVenda.util.js";

export async function buscarItemVendidoService(empresa_id: number, id: number) {

    validarIdVenda(empresa_id, "Empresa");

    validarIdVenda(id, "Item vendido");

    const item = await buscarItemVendidoRepository(empresa_id, id);

    if (!item) {

        throw new ErroVenda("Item vendido não encontrado.", 404);

    }

    return item;

}
