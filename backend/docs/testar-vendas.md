# Vendas e itens vendidos

## Regras implementadas

- A venda nasce com status `pendente`. `PATCH /vendas/:id/pagar` confirma como `pago`. O cancelamento muda para `cancelado`.
- `empresa_id` e `usuario_id` vêm do token. A requisição informa `cliente_id` e `itens`.
- Empresa, usuário e cliente precisam estar ativos para criar ou alterar uma venda.
- Cliente e produtos devem pertencer à empresa autenticada. Produtos precisam estar ativos.
- Cada item recebe `produto_id` e uma `quantidade` inteira positiva. Um produto só pode aparecer uma vez na lista.
- `valor_vendido` é o **preço unitário** do produto no momento da venda, arredondado para centavos. `valor_total` é a soma de preço unitário × quantidade, calculada em centavos.
- Preços, total, empresa, usuário, data e status enviados pelo cliente da API não substituem os valores calculados pelo servidor.
- A criação baixa o estoque. Uma falha desfaz a venda, os itens e todas as baixas.
- Alterar somente `cliente_id` mantém preços, itens e estoque. Alterar `itens` **substitui a lista inteira**, devolve o estoque antigo e baixa o novo, usando os preços atuais dos produtos. Os IDs antigos dos itens não devem ser reutilizados.
- Cancelar preserva a venda, o total e os itens para consulta e devolve o estoque. Repetir o cancelamento retorna sucesso sem devolver novamente. Venda cancelada não pode ser alterada ou reativada.
- Os itens não têm POST, PATCH ou DELETE próprios: as gravações são feitas pela venda para manter total e estoque consistentes.
- Cada transação de venda usa uma conexão SQLite exclusiva. Isso também protege a disputa pelo último produto e cancelamentos simultâneos.
- As tabelas de vendas e itens vendidos foram mantidas. A inicialização também executa a migração de autenticação descrita no [guia de acesso inicial](acesso-inicial.md).

## Testes automatizados

Na raiz do projeto, com as dependências instaladas e Node.js 24:

```sh
npm run build -- --noEmit
npm run test:vendas
```

Os testes usam HTTP local e um banco SQLite temporário com as seis tabelas extraídas do `esquema.ts` e a migração de acesso. Não usam nem alteram `src/database/database.db`. Ao final, encerram as conexões e removem o banco de teste. `npm run test:turso` também executa os fluxos usando o adaptador do Turso com um banco libSQL temporário, sem acessar o banco remoto.

Cobertura: autenticação, criação, total e estoque, consulta, filtro de itens, isolamento entre empresas, dados inválidos, registros inativos, rollback, alteração, cancelamento repetido e simultâneo, venda concorrente, preço histórico e resposta genérica a falhas de banco.

## Preparação para teste manual

Os testes manuais abaixo alteram os dados reais do ambiente em que a API estiver rodando. Use registros de teste.

1. Siga o [guia do superAdmin e primeiro acesso](acesso-inicial.md) para criar sua conta global, cadastrar uma empresa e trocar as credenciais temporárias do admin.
2. Use uma empresa e um usuário ativos com o primeiro acesso concluído. Para vendas, use o token empresarial, não o token do superAdmin nem o temporário.
3. Faça login em `POST http://localhost:3000/usuarios/login`:

```json
{
  "empresa_id": 1,
  "email": "seu-email@exemplo.com",
  "senha": "sua-senha"
}
```

4. Copie o `token` da resposta. No Postman/Insomnia, selecione **Bearer Token** e cole o token. Todas as próximas rotas exigem `Authorization: Bearer SEU_TOKEN`.
5. Para POST/PATCH, use `Content-Type: application/json`.
6. Crie ou escolha um cliente ativo da mesma empresa. Consulte seu ID com `GET /clientes`.

Exemplo de `POST /clientes`:

```json
{
  "nome": "Cliente de teste",
  "email": "cliente-teste@exemplo.com",
  "telefone": "71999990000",
  "status": "ativo"
}
```

7. Crie dois produtos ativos da mesma empresa usando `POST /produtos`. Consulte os IDs com `GET /produtos`.

Produto A:

```json
{
  "produto": "Produto A",
  "estoque": 10,
  "preco": 25.5,
  "categoria": "Teste",
  "codigo": "TESTE-A",
  "status": "ativo"
}
```

Produto B: use outro nome e código, estoque **5** e preço **10**.

Os IDs abaixo são exemplos: substitua pelos IDs reais do cliente e dos produtos cadastrados.

## 1. Criar uma venda

`POST http://localhost:3000/vendas`

```json
{
  "cliente_id": 1,
  "itens": [
    { "produto_id": 1, "quantidade": 2 },
    { "produto_id": 2, "quantidade": 1 }
  ]
}
```

Esperado: **201**. A resposta traz `mensagem` e `dados`, com ID da venda, empresa, usuário, cliente, data, total, status e itens completos.

- Total: **61** (2 × 25,50 + 1 × 10).
- Status: `pendente`.
- Estoque do produto A: **8**; produto B: **4**.
- Confira o estoque em `GET /produtos/:id` e guarde o ID retornado da venda.

## 2. Consultar vendas e itens

| Requisição | Resultado esperado |
| --- | --- |
| `GET /vendas` | Vendas da empresa autenticada, incluindo canceladas, em `dados`. |
| `GET /vendas/ID_VENDA` | Venda com sua lista de `itens`. |
| `GET /itens-vendidos` | Todos os itens da empresa, inclusive de vendas canceladas. |
| `GET /itens-vendidos?venda_id=ID_VENDA` | Somente itens dessa venda. Filtro sem resultados retorna lista vazia. |
| `GET /itens-vendidos/ID_ITEM` | Um item vendido. Use o ID do item, não o ID do produto. |

## 3. Alterar a venda

`PATCH /vendas/ID_VENDA`

```json
{
  "itens": [
    { "produto_id": 1, "quantidade": 3 }
  ]
}
```

Esperado: **200**, total **76,50**, estoque A **7**, estoque B **5**. O produto B sai da venda porque a lista foi substituída. Consulte novamente a venda para obter os IDs atuais dos itens.

Para trocar somente o cliente, envie `{"cliente_id": OUTRO_ID_VALIDO}`. O cliente deve estar ativo e pertencer à mesma empresa; itens, preços e estoque permanecem como estavam.

Se os preços dos produtos forem alterados depois de uma venda, a consulta mantém o preço histórico. Ao substituir os itens via PATCH, o servidor usa os preços atuais.

## 4. Testar falhas e rollback

Antes de cancelar a venda, faça estas tentativas:

| Caso | HTTP esperado |
| --- | --- |
| Sem token, token inválido ou expirado | 401 |
| ID inválido (`abc`, `0`, `-1`) | 400 |
| Quantidade zero, negativa, fracionária ou texto | 400 |
| Lista vazia, produto repetido, corpo vazio ou PATCH sem campos reconhecidos | 400 |
| Venda/item inexistente ou pertencente a outra empresa | 404 |
| Cliente/produto de outra empresa na criação | 404 |
| Produto ou cliente inativo na criação/alteração | 409 |
| Usuário ou empresa autenticada inativos | 401 |
| Quantidade maior que o estoque disponível | 409 |
| Alterar uma venda cancelada | 409 |
| Banco ocupado além do tempo de espera | 409 |
| Falha interna inesperada | 500 com mensagem genérica |

Para verificar rollback, tente criar uma venda com dois itens: o primeiro válido e o segundo com quantidade **999999**. Depois do **409**, confirme que não surgiu uma venda parcial e que o estoque do primeiro produto não mudou. Repita com PATCH na venda existente: após a falha, itens, total e estoque devem continuar iguais aos anteriores.

## 5. Cancelar

`DELETE /vendas/ID_VENDA`

Esperado: **200**, status `cancelado`, estoque A **10** e B **5**, considerando apenas a sequência deste roteiro.

Repita o DELETE: deve retornar **200** e o estoque deve continuar **10** e **5**. A venda e seus itens continuam disponíveis para consulta. Um PATCH nessa venda deve retornar **409**.

## Organização dos arquivos e commits

- `vendas/dtos`: contratos de criação, alteração e resposta.
- `vendas/services`: validação das entradas e chamada dos repositórios.
- `vendas/repositories`: consultas e transações de criação, alteração e cancelamento.
- `itens_vendidos/repositories`: preço vendido, inserção dos itens, estoque e consultas.
- `controllers`: respostas HTTP e tratamento dos erros conhecidos.
- `routes`: endpoints protegidos pela autenticação existente.
- `tests/vendas.test.mjs`: testes reproduzíveis com banco temporário.

Foi criado um commit individual por arquivo novo. A integração em `app.ts` e o comando de teste em `package.json` têm commits próprios. Consulte `git log --oneline` para revisar a sequência.

## Pagamento e migração

Na lista ou nos detalhes, use **Marcar como pago** após receber. A confirmação é idempotente e não altera estoque. Apenas vendas pendentes podem ser editadas. Vendas pendentes ou pagas podem ser canceladas, devolvendo estoque uma única vez. Canceladas não podem ser pagas.

Na inicialização, registros antigos `concluida` passam a `pendente`, pois não havia confirmação de pagamento; `cancelada` passa a `cancelado`. O dashboard soma apenas vendas pagas.


## Itens avulsos, comentários e parcelamento

Na etapa de produtos, use **Item avulso** para informar descrição, preço unitário e quantidade sem cadastrar no catálogo. É possível misturar itens avulsos e produtos cadastrados; somente estes movimentam estoque.

Na revisão, informe comentários (até 2.000 caracteres), entrada já recebida e, opcionalmente, de 1 a 120 parcelas mensais com o primeiro vencimento. O saldo é dividido em centavos; meses mais curtos usam seu último dia. Zero parcelas mantém o saldo sem agenda de vencimentos.

Nos detalhes, registre o valor de cada recebimento. A venda permanece pendente até a quitação. Os recebimentos posteriores à entrada abatem as parcelas mais antigas primeiro. Comentários podem ser editados em vendas pendentes ou pagas. Itens e cliente ficam bloqueados após receber pagamentos ou criar parcelas.

Cancelar preserva o histórico de recebimentos e devolve somente o estoque de produtos cadastrados. Não realiza estorno financeiro; eventual devolução é acertada fora do sistema.

### API

POST /vendas aceita, por exemplo:

```json
{
  "cliente_id": 1,
  "comentarios": "Entregar na próxima compra",
  "entrada": 20,
  "parcelamento": { "quantidade": 3, "primeiro_vencimento": "2026-10-15" },
  "itens": [{ "descricao": "Produto do ciclo", "valor_unitario": 50, "quantidade": 2 }]
}
```

PATCH /vendas/:id/pagar com {"valor": 15} registra um recebimento parcial. Sem valor, quita o saldo (compatibilidade com o fluxo anterior). GET /vendas/:id retorna comentários, pagamentos, parcelas, valor_pago e saldo.

### Atualização do banco

A migração local é automática ao iniciar. Antes de publicar esta versão na Vercel, execute `npm run preparar:turso` no ambiente configurado para o banco correto. A versão esperada passa a ser `asr_schema_v3_vendas`. A migração preserva IDs, itens e vendas existentes, permite produto_id nulo nos itens avulsos e registra a quitação das vendas antigas com status pago. Não executamos migrações no banco de produção durante o desenvolvimento.


## Exclusão com confirmação e senha

Em clientes, produtos, usuários e empresas, abra **Editar → Excluir**. Nas vendas, abra os detalhes e **Editar venda → Excluir permanentemente**. A confirmação identifica o registro, descreve o alcance e exige a senha atual de quem está conectado; senha incorreta mantém o diálogo aberto e não encerra a sessão.

- Clientes, produtos e usuários vinculados a vendas não podem ser apagados. É possível inativá-los pelo status na edição para manter o histórico.
- Usuários só podem ser excluídos por administradores ou gerentes. O último administrador ativo não pode ser excluído individualmente.
- Empresas só podem ser excluídas pelo superadmin, com a senha dele. A confirmação informa que todos os cadastros, vendas, parcelas e pagamentos daquela empresa serão apagados. A operação é atômica.
- Excluir uma venda apaga seus itens, parcelas e pagamentos e devolve o estoque apenas se a venda não estava cancelada. Não realiza estorno financeiro.
- Cancelar uma venda fica dentro da edição, também exige senha e preserva o histórico.

A exclusão permanente usa `DELETE /:entidade/:id/excluir`, com `{"senha_atual":"senha de quem está conectado"}` no corpo JSON. Entidades: clientes, produtos, usuarios, empresas e vendas. As rotas anteriores `DELETE /:entidade/:id` continuam inativando/cancelando e agora também exigem `senha_atual`. A aplicação não persiste a senha no armazenamento do navegador nem a devolve pela API.
