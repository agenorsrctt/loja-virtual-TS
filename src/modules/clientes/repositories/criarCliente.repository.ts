import type { criarClienteDTO } from "../dtos/interfacesCliente.dto.js";
import db from "../../../database/connection.js";

export function criarClienteRepository(dados: criarClienteDTO): Promise<void> {

    const sql = "INSERT INTO CLIENTES(empresa_id, nome, email, telefone, status) VALUES(?,?,?,?,?)";

    const valores = [
        dados.empresa_id,
        dados.nome,
        dados.email,
        dados.telefone,
        dados.status,
        dados.senha
    ];

    return new Promise<void>((resolve, reject) => {
        db.run(sql, valores, function (erro) {
            if(erro){
                return reject(new Error("Erro ao criar cliente, verifique as informações e tente novamente, Error: " + erro.message));
            }

            resolve();
        })
    });

};