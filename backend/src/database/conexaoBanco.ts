export type ValorSQL = string | number | null;

export type RetornoEscrita = { lastID: number; changes: number };

export interface ConexaoBanco {

    run(sql: string, valores: ValorSQL[], retorno: (this: RetornoEscrita, erro: Error | null) => void): unknown;

    get<T>(sql: string, valores: ValorSQL[], retorno: (erro: Error | null, registro: T | undefined) => void): unknown;

    all<T>(sql: string, valores: ValorSQL[], retorno: (erro: Error | null, registros: T[]) => void): unknown;

    close(retorno: (erro: Error | null) => void): unknown;

}
