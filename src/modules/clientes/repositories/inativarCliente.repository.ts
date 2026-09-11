import db from "../../../database/connection.js";

export function inativarClienteRepository(empresa_id: number, id: number): Promise<void> {
    
    const valores: number[] = [];
    valores.push(empresa_id, id);
    
    const sql = "UPDATE CLIENTE SET status = inativo WHERE empresa_id = ? AND id = ?";

    return new Promise<void>((resolve, reject) => {
        db.run(sql, valores, function (erro) {
            
        })
    })
}