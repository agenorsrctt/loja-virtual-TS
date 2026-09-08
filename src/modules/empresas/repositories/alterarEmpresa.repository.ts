import type { alterarEmpresaDTO } from "../dtos/alterarEmpresa.dto.js";
import db from "../../../database/connection.js";

export function alterarEmpresaRepository(dados: alterarEmpresaDTO, id: number): Promise<void> {
    
    const valores: (string | number)[] = [];
    const campos: string[] = [];
    
    if(dados.empresa) {
        valores.push(dados.empresa);
        campos.push("empresa = ?");
    }
    
    if(dados.cnpj) {
        valores.push(dados.cnpj);
        campos.push("cnpj = ?");
    }
    
    if(dados.status) {
        valores.push(dados.status);
        campos.push("status = ?");
    }

    if(valores.length === 0) {
        throw new Error("Nenhum campo foi escolhido para atualização.")
    }

    valores.push(id);
    
    const sql = `UPDATE EMPRESAS SET ${campos.join(", ")} WHERE id = ?`;
    
    return new Promise<void>((resolve, reject) => {
        db.run(sql, valores, async function (erro) {
            if(erro) {
                return reject(new Error("Repository - ERROR: " + erro));
            };

            if(this.changes === 0) {
                return reject(new Error("Repository - Changes: " + erro));
            };

            resolve();
        });
    });
};