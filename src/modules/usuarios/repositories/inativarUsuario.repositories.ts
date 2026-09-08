import db from "../../../database/connection.js";

export function invativarUsuariosRepository(id: number): Promise<void> {

    const sql = "UPDATE USUARIOS SET status = inativo";

    return new Promise<void>((resolve, reject) => {
        db.run(sql, function (erro) {
            if(erro) {
                return reject(new Error("Inativar Repository Error: "+ erro));
            }

            if(this.changes === 0){
                return reject(new Error("Inativar Repository Error: Nenhuma alteração realizada"));
            }

            resolve();
        })
    })

}