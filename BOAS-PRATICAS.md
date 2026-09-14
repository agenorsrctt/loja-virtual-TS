# Boas Práticas — Loja Virtual TS

## Estrutura

```text
Route       → endpoint + middlewares
Controller  → req / res
Service     → regras e validações
Repository  → SQL / banco
DTO         → formato dos dados
Middleware  → autenticação / autorização
```

## Nomenclatura

* Arquivos e funções no singular.
* URLs no plural.
* Padronizar `Dto`.

```text
criarUsuario.controller.ts
criarUsuario.service.ts
criarUsuario.repository.ts

/usuarios
/clientes
/produtos
/vendas
```

## Segurança

* Nunca retornar `senha`, nem mesmo o hash.
* Senhas sempre com bcrypt.
* `JWT_SECRET` somente no `.env`.
* Rotas protegidas recebem `empresa_id` pelo JWT.
* Nunca confiar no `empresa_id` enviado pelo body em rotas autenticadas.
* Autenticação = quem é o usuário.
* Autorização = o que o usuário pode fazer.

## Banco de dados

* Evitar `SELECT *`.
* Usar `WHERE empresa_id = ?` nas operações multiempresa.
* Validar `this.changes` em `UPDATE`.
* Usar transações em vendas e alterações de estoque.
* Validar IDs como inteiros positivos.

```ts
Number.isInteger(id) && id > 0
```

## HTTP

```text
200 → sucesso
201 → criado
400 → dados inválidos
401 → não autenticado
403 → sem permissão
404 → não encontrado
409 → conflito/duplicidade
500 → erro interno
```

## .gitignore

Não versionar:

```text
node_modules/
.env
*.db
dist/
```

Manter um:

```text
.env.example
```

Exemplo:

```env
PORT=3050
JWT_SECRET=
```

## Commits

```text
1 commit = 1 alteração lógica
```

Fluxo:

```text
Alterar → Testar → Commit → Próxima tarefa
```

Tipos principais:

```text
feat: nova funcionalidade
fix: correção
refactor: reorganização
docs: documentação
chore: manutenção/configuração
test: testes
```

## Desenvolvimento

Antes de considerar uma funcionalidade pronta:

```text
Implementar
    ↓
Validar
    ↓
Testar no Thunder Client
    ↓
Corrigir
    ↓
Testar novamente
    ↓
Commit
```

Evitar desenvolver várias funcionalidades diferentes antes de fazer commit.

## Próximos passos

```text
1. Padronizar estrutura e nomes
2. Finalizar Usuários
3. Melhorar tratamento de erros HTTP
4. Finalizar Clientes
5. Implementar Produtos
6. Implementar Vendas
7. Controle de estoque + transações
8. Testes automatizados
9. Documentar API no README
```

> Prioridade: código simples, organizado, seguro e consistente. Evitar complexidade sem necessidade.
