import bcrypt from "bcrypt";

export async function gerarHashSenha(senha: string): Promise<string> {

    if (typeof senha !== "string" || !senha.trim()) {
        throw new Error("Senha inválida, tente novamente.");

    }

    return await bcrypt.hash(senha, 10);

}

export async function verificarSenha(senha: string, hashSenha: string): Promise<boolean> {

    if (typeof senha !== "string" || !senha.trim() || typeof hashSenha !== "string" || !hashSenha.trim()) {
        return false;

    }

    return await bcrypt.compare(senha, hashSenha);

}
