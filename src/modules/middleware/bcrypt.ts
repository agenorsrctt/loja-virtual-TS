import bcrypt from "bcrypt";

export function gerarHash(senha: string): Promise<string> {

    return bcrypt.hash(senha, 10)
}

export function compararHash(senha: string, senhaBanco: string): Promise<boolean> {

    return bcrypt.compare(senha, senhaBanco);
}