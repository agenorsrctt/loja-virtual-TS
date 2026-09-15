export class ErroVenda extends Error {

    constructor(mensagem: string, public readonly status: 400 | 404 | 409) {

        super(mensagem);

        this.name = "ErroVenda";

    }

}
