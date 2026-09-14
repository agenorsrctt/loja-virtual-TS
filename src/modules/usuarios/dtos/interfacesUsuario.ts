import type { PrimeiroAcesso, Status, Tipo } from "./typesUsuario.js";

export interface CriarUsuarioDto {
    readonly empresa_id: number;
    nome: string;
    tipo: Tipo;
    email: string;
    senha: string;
}

export interface AlterarUsuarioDto {
    readonly id: number;
    readonly empresa_id: number;
    nome?: string;
    tipo?: Tipo;
    email?: string;
    status?: Status;
    senha?: string;
}

export interface UsuarioDto {
    readonly id: number;
    readonly empresa_id: number;
    nome: string;
    tipo: Tipo;
    email: string;
    status: Status;
    senha: string
}

export interface TokenUsuarioDto {
    readonly id: number;
    readonly empresa_id: number;
    tipo: Tipo;
    email: string;
}

export interface loginUsuarioDTO {
    readonly email: string;
    readonly senha: string;
}