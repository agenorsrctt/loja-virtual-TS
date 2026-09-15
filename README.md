# ASR Systems — gestão de vendas

Frontend em HTML, CSS e JavaScript modular, integrado ao backend TypeScript, Express e SQLite.

## Estrutura

- `backend/`: API, banco, scripts, testes, documentação e configuração `.env`.
- `frontend/compartilhado/`: estilos, integração com a API e componentes comuns.
- `frontend/`: cada página tem sua própria pasta com HTML, CSS e JavaScript.
- `package.json`: comandos para executar o projeto pela raiz.

As páginas são: login, primeiro acesso, dashboard, clientes, produtos, usuários, empresas, vendas, nova venda, detalhes da venda, venda concluída e perfil.

## Executar

Na raiz do repositório, com Node.js 24:

```sh
npm --prefix backend install
npm run dev
```

Acesse **http://localhost:3000**. O backend serve o frontend em `/app`, na mesma origem da API. Use esse endereço em vez de abrir os arquivos HTML diretamente.

O `.env` e o banco existentes foram movidos junto com o backend. A configuração fica em `backend/.env`.

## Primeiro acesso

1. Caso ainda não exista um SuperAdmin, configure as variáveis em `backend/.env` conforme o [guia de acesso](backend/docs/acesso-inicial.md) e execute `npm run criar-superadmin` na raiz.
2. Na tela de login, selecione SuperAdmin e entre com suas credenciais.
3. Cadastre uma empresa e guarde as credenciais temporárias apresentadas para seu primeiro administrador.
4. Saia e entre pela opção Empresa, informando o código da empresa e as credenciais recebidas.
5. Altere o e-mail e a senha no primeiro acesso. Entre novamente para acessar as demais páginas.

O perfil permite alterar a própria senha, inclusive a do SuperAdmin. A alteração encerra as sessões anteriores e exige novo login.

## Funcionalidades

- Dashboard com indicadores calculados a partir dos dados da API, vendas recentes e estoque baixo.
- Clientes, produtos, usuários e empresas com formulários, pesquisa e ações conforme as permissões.
- Venda em três etapas: cliente, itens e revisão.
- Consulta, edição e cancelamento de vendas, com atualização de estoque pelo backend.
- Interface responsiva com navegação lateral no computador e inferior no celular.

Os valores finais da venda são calculados pelo backend. Campos de pagamento e motivo de cancelamento não são apresentados porque o modelo atual da API não os armazena.

## Verificação

Execute na raiz:

```sh
npm run build
npm run test:frontend
npm run test:acesso
npm run test:vendas
```

Os testes verificam contratos da API, autenticação, estoque, arquivos modulares e entrega HTTP do frontend. Eles não substituem a revisão visual e a interação manual no navegador.

Para testar a interface, cadastre um cliente e um produto com estoque, conclua uma venda e confira seu total e estoque. Edite a venda e depois cancele para conferir a devolução do estoque. Teste também o primeiro acesso, a troca de senha e a navegação em uma tela estreita.

Consulte o [roteiro de vendas](backend/docs/testar-vendas.md) para exemplos adicionais.

## Status e acesso inicial

Novas vendas ficam **pendentes**. Na lista e nos detalhes, use **Marcar como pago** ou **Cancelar**. Só vendas pendentes podem ser editadas. O cancelamento devolve o estoque uma única vez; marcar como pago não altera o estoque. O dashboard soma apenas vendas pagas. Vendas antigas concluídas são migradas para pendentes para confirmação manual do pagamento.

Novas empresas usam o código numérico sequencial, e-mail `primeiro@acesso.com` e senha temporária `123456`. A troca de e-mail e senha continua obrigatória no primeiro acesso; a senha definitiva continua exigindo pelo menos 12 caracteres. Contas existentes e o SuperAdmin mantêm suas credenciais.
