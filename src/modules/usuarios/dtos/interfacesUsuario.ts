import type { PrimeiroAcesso, Status, Tipo } from "./typesUsuario.js";

export interface CriarUsuarioDto {
    empresa_id: number;
    nome: string;
    tipo: Tipo;
    email: string;
    senha: string;
    primeiroAcesso: PrimeiroAcesso;
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
    senha: string;
}

export interface loginUsuarioDTO {
    readonly email: string;
    readonly senha: string;
}