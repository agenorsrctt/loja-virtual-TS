import "dotenv/config";

import db, { bancoPronto } from "../src/database/init.js";

import { criarSuperAdminService } from "../src/modules/acesso/services/acesso.service.js";

import { ErroAcesso } from "../src/modules/acesso/utils/acesso.util.js";

try {

    await bancoPronto;

    await criarSuperAdminService(process.env.SUPERADMIN_EMAIL, process.env.SUPERADMIN_SENHA);

    console.log("SuperAdmin criado. Remova SUPERADMIN_SENHA do ambiente e faça login em /administracao/login.");

} catch (erro) {

    console.error(erro instanceof ErroAcesso ? erro.message : "Não foi possível criar o superAdmin. Confira o banco e a configuração.");

    process.exitCode = 1;

} finally {

    await new Promise<void>((resolve, reject) => {

        db.close((erro) => erro ? reject(erro) : resolve());

    });

}
