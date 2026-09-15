import db from "../../../database/connection.js";

import { buscarSQL, executarSQL } from "../../vendas/repositories/transacaoVenda.repository.js";

export interface ContaAcesso {

    id: number;

    email: string;

    senha: string;

    versao_token: number;

}

export interface ContaEmpresa extends ContaAcesso {

    empresa_id: number;

    tipo: "admin" | "gerente" | "colaborador";

    primeiro_acesso: number;

    status: string;

    empresa_status: string;

}

export function buscarSuperAdmin() {

    return buscarSQL<ContaAcesso>(db, "SELECT * FROM SUPER_ADMIN WHERE id = 1");

}

export function criarSuperAdmin(email: string, senha: string) {

    return executarSQL(db, "INSERT INTO SUPER_ADMIN(id, email, senha) VALUES(1, ?, ?)", [email, senha]);

}

export function buscarContaEmpresa(empresa_id: number, id: number) {

    return buscarSQL<ContaEmpresa>(db, "SELECT u.*, e.status AS empresa_status FROM USUARIOS u JOIN EMPRESAS e ON e.id = u.empresa_id WHERE u.empresa_id = ? AND u.id = ?", [empresa_id, id]);

}

export function buscarLoginEmpresa(empresa_id: number, email: string) {

    return buscarSQL<ContaEmpresa>(db, "SELECT u.*, e.status AS empresa_status FROM USUARIOS u JOIN EMPRESAS e ON e.id = u.empresa_id WHERE u.empresa_id = ? AND u.email = ?", [empresa_id, email]);

}

export function concluirPrimeiroAcesso(conta: ContaEmpresa, email: string, senha: string) {

    return executarSQL(db, "UPDATE USUARIOS SET email = ?, senha = ?, primeiro_acesso = 0, versao_token = versao_token + 1 WHERE id = ? AND empresa_id = ? AND primeiro_acesso = 1 AND versao_token = ? AND status = 'ativo' AND EXISTS (SELECT 1 FROM EMPRESAS WHERE id = ? AND status = 'ativo')", [email, senha, conta.id, conta.empresa_id, conta.versao_token, conta.empresa_id]);

}

export function atualizarSenhaSuperAdmin(versao: number, senha: string) {

    return executarSQL(db, "UPDATE SUPER_ADMIN SET senha = ?, versao_token = versao_token + 1 WHERE id = 1 AND versao_token = ?", [senha, versao]);

}
