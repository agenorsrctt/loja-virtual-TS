# ASR Systems | Gestão de vendas e estoque

Aplicação full stack para gerenciar clientes, produtos, vendas e usuários de diferentes empresas, com separação de dados e controle de permissões.

Desenvolvida com **TypeScript, Node.js e Express**, interface responsiva em **HTML, CSS e JavaScript**, banco **SQLite** no ambiente local e **Turso** na nuvem. Frontend e API publicados na **Vercel**.

**[Acessar o aplicativo](https://asr-systems.vercel.app/)** · **[Repositório](https://github.com/agenorsrctt/loja-virtual-TS)** · **[Guia de publicação](backend/docs/publicar-vercel-turso.md)**

> O acesso às funcionalidades exige autenticação. Para explorar o sistema com seus próprios dados, execute o projeto localmente conforme as instruções abaixo.

## Sobre o projeto

O ASR Systems reúne o fluxo de uma operação comercial: cadastrar clientes e produtos, registrar vendas, acompanhar pagamentos e manter o estoque consistente.

O projeto demonstra a integração entre interface, API e banco de dados, com atenção a regras de negócio, autenticação, isolamento entre empresas, testes automatizados e publicação em nuvem.

## Funcionalidades

| Área | Recursos |
| --- | --- |
| Dashboard | Indicadores baseados na API, vendas recentes e alertas de estoque baixo. |
| Clientes e produtos | Cadastro, consulta, pesquisa e atualização conforme as permissões. |
| Vendas | Fluxo em três etapas: seleção do cliente, inclusão de itens e revisão. |
| Estoque | Baixa ao registrar a venda e devolução no cancelamento, com transações. |
| Acompanhamento | Detalhes da venda, edição de pendentes, marcação de pagamento e cancelamento. |
| Empresas e usuários | Administração de empresas pelo SuperAdmin e acesso aos dados por empresa. |
| Perfil e acesso | Troca obrigatória de credenciais no primeiro acesso e alteração de senha com revogação das sessões anteriores. |
| Interface e PWA | Layout responsivo, navegação adaptada ao celular e instalação em navegadores compatíveis. |

## Regras de negócio em destaque

- **Valores calculados no backend:** preços e total da venda são conferidos pelo servidor.
- **Venda e estoque na mesma transação:** falhas desfazem as alterações para evitar registros parciais.
- **Cancelamento sem duplicar a reposição:** cancelar novamente não devolve o estoque pela segunda vez.
- **Status definidos:** novas vendas ficam pendentes; apenas pendentes podem ser editadas. Marcar como paga não altera o estoque, e o dashboard contabiliza vendas pagas.
- **Separação por empresa:** autenticação e consultas restringem o acesso ao contexto da empresa do usuário.
- **Administração global separada:** o SuperAdmin gerencia empresas, sem acesso operacional aos clientes, produtos e vendas delas.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | HTML5, CSS3 e JavaScript modular |
| Backend | TypeScript, Node.js 24 e Express 5 |
| Autenticação | JWT e bcrypt para hash de senhas |
| Banco local | SQLite |
| Banco na nuvem | Turso / libSQL |
| Testes | Test runner nativo do Node.js, testes HTTP e bancos temporários |
| Publicação | Vercel integrada ao GitHub |
| PWA | Web App Manifest, service worker e tela de reconexão |

## Organização e decisões técnicas

O backend é organizado por módulos de negócio, com rotas, controladores, serviços e repositórios. A camada de banco compartilha um contrato entre SQLite e Turso, permitindo trabalhar localmente e publicar com persistência remota.

Frontend e API usam a mesma origem: as páginas ficam em `/app/` e consomem as rotas do backend. No deploy, os arquivos do frontend são preparados para entrega estática pela Vercel.

Na nuvem, o banco é preparado por comandos específicos antes da publicação. A aplicação verifica a versão do esquema ao iniciar. As dependências nativas de SQLite são carregadas apenas no fluxo local.

```text
loja-virtual-TS/
├── backend/
│   ├── docs/              # Guias de acesso, testes e publicação
│   ├── scripts/           # Preparação do banco e tarefas administrativas
│   ├── src/
│   │   ├── database/      # Conexões, adaptadores e migrações
│   │   ├── modules/       # Módulos de negócio e autenticação
│   │   ├── app.ts         # Aplicação Express
│   │   └── server.ts      # Servidor local
│   ├── tests/             # Testes automatizados
│   └── vercel.json        # Configuração de publicação
├── frontend/
│   ├── compartilhado/     # Componentes, estilos e integração com a API
│   ├── icones/            # Ícones do aplicativo
│   └── ...                # Páginas por funcionalidade
└── package.json           # Comandos executados pela raiz
```

## Executar localmente

### 1. Instalar as dependências

Com **Git** e **Node.js 24** instalados:

```sh
git clone https://github.com/agenorsrctt/loja-virtual-TS.git
cd loja-virtual-TS
npm --prefix backend ci --include=dev
```

### 2. Configurar o ambiente

Crie `backend/.env` com os valores da sua instalação:

```dotenv
JWT_SECRET=seu-segredo-aleatorio-longo
SUPERADMIN_EMAIL=seu-email@exemplo.com
SUPERADMIN_SENHA=sua-senha-inicial-exclusiva
```

Para gerar um segredo aleatório:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

A senha inicial deve ter pelo menos 12 caracteres e no máximo 72 bytes em UTF-8. O arquivo `.env` é local e não deve ser enviado ao Git. Para usar SQLite, deixe as variáveis do Turso ausentes nesse ambiente.

### 3. Criar o SuperAdmin e iniciar

Execute na raiz:

```sh
npm run criar-superadmin
npm run dev
```

Abra **[http://localhost:3000](http://localhost:3000)**. Após criar a conta, remova `SUPERADMIN_SENHA` do `.env`.

### 4. Explorar o sistema

1. Entre pela opção **SuperAdmin** com as credenciais configuradas.
2. Cadastre uma empresa e guarde o código e as credenciais temporárias apresentados.
3. Saia e entre pela opção **Empresa**.
4. Conclua a troca obrigatória de e-mail e senha.
5. Cadastre um cliente e um produto com estoque, registre uma venda e acompanhe os indicadores.

Consulte o [guia de acesso inicial](backend/docs/acesso-inicial.md) para detalhes de autenticação e administração.

## Testes e validação

Execute os comandos na raiz:

```sh
npm run build
npm run test:acesso
npm run test:vendas
npm run test:frontend
npm run test:turso
npm run test:publicacao
```

Os cenários incluem autenticação, permissões, primeiro acesso, isolamento entre empresas, cálculo de vendas, rollback, concorrência no estoque, cancelamento, migrações, arquivos do PWA e inicialização em modo Vercel sem carregar SQLite.

Os testes usam bancos temporários. `test:turso` exercita o adaptador com libSQL local; não acessa a conta Turso nem valida a latência da nuvem. A instalação do PWA e a experiência visual também exigem conferência manual no navegador.

Veja também o [roteiro de testes de vendas](backend/docs/testar-vendas.md).

## Publicação

O ambiente online utiliza **Vercel para frontend e API** e **Turso para os dados**. A configuração inclui a preparação do banco, variáveis de ambiente e deploy pela branch de produção.

O passo a passo está no **[guia de publicação na Vercel com Turso](backend/docs/publicar-vercel-turso.md)**.

## PWA e escopo atual

O aplicativo pode ser instalado em navegadores compatíveis pelo botão **Instalar app** ou pelo menu do navegador. Em dispositivos móveis, a publicação usa HTTPS.

- Login, consultas e gravações exigem conexão. Sem internet, o aplicativo apresenta uma tela de reconexão; não registra vendas offline.
- A marcação de venda paga é manual. O projeto não possui integração com gateway de pagamento.
- O service worker armazena os recursos da tela offline; não mantém dados da API ou vendas em uma fila de sincronização.
- Quando uma atualização do service worker estiver disponível, salve o trabalho antes de aceitar o recarregamento.

## Autor

Desenvolvido por **[agenorsrctt](https://github.com/agenorsrctt)** como projeto de portfólio em desenvolvimento full stack.
