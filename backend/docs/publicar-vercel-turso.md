# Publicar o ASR Systems na Vercel com Turso

O frontend e a API serão publicados juntos na Vercel. Os dados ficarão no Turso. Depois da publicação, seu computador poderá ficar desligado: o serviço online usará essa infraestrutura.

A configuração está preparada no repositório, mas as contas, o banco remoto e a publicação precisam ser configurados por você. Os testes automatizados usam bancos temporários; não enviaram seus dados para a nuvem.

## 1. Criar o banco no Turso

1. Entre no [Turso](https://turso.tech/) e crie sua conta.
2. Crie um banco compatível com **libSQL**, por exemplo `asr-systems`. Escolha uma região próxima da região de execução da função na Vercel, para reduzir o tempo das operações.
3. Copie a **Database URL**, normalmente iniciada com `libsql://`.
4. Gere um **token de acesso ao banco** com permissão de leitura e escrita. Não use um token da API de gerenciamento da conta.

Guarde a URL e o token para os próximos passos. Não envie tokens, senhas ou o conteúdo do `.env` pelo chat nem os inclua no Git.

### Se quiser levar os cadastros atuais

Um banco novo começa vazio. O arquivo local `backend/src/database/database.db` continua no computador e não é enviado automaticamente.

Para importar os dados existentes, faça isso **antes** de preparar o banco remoto:

1. Pare o servidor local com `Ctrl+C` e encerre outras ferramentas que estejam escrevendo no SQLite.
2. Faça uma cópia de segurança consistente do banco, fora do repositório. Se houver arquivos `database.db-wal` ou `database.db-shm`, use a função de backup do SQLite em vez de copiar apenas o `.db`.
3. Crie o banco remoto a partir dessa cópia com a [opção `--from-file` do Turso CLI](https://docs.turso.tech/cli/db/create):

   ```sh
   turso db create asr-systems --from-file /caminho/para/copia.db
   turso db show asr-systems --url
   turso db tokens create asr-systems
   ```

No Windows, a [instalação do Turso CLI](https://docs.turso.tech/cli/installation) usa WSL. O caminho do arquivo precisa ser acessível dentro do WSL. Se preferir começar sem os cadastros antigos, basta criar um banco vazio pelo painel.

As migrações preservam os registros existentes e aplicam as mesmas regras do aplicativo local. Se importar um banco que já tem SuperAdmin, entre com essa conta e pule a criação de outro.

## 2. Configurar o ambiente de preparação

Use Node.js 24. Execute os comandos na **raiz do repositório**:

```powershell
npm --prefix backend ci --include=dev

if (!(Test-Path backend/.env.turso)) {

    Copy-Item backend/.env.turso.example backend/.env.turso

}
```

Abra `backend/.env.turso` e preencha:

```dotenv
TURSO_DATABASE_URL=libsql://seu-banco-sua-organizacao.turso.io
TURSO_AUTH_TOKEN=token-do-seu-banco
JWT_SECRET=segredo-aleatorio-longo
SUPERADMIN_EMAIL=seu-email@exemplo.com
SUPERADMIN_SENHA=sua-senha-exclusiva
```

Gere um `JWT_SECRET` no seu terminal e guarde o valor:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

A senha do SuperAdmin precisa ter pelo menos 12 caracteres e no máximo 72 bytes em UTF-8. `SUPERADMIN_EMAIL` e `SUPERADMIN_SENHA` só são necessários para criar a conta em um banco que ainda não a possui.

O arquivo `.env.turso` é ignorado pelo Git. Ele é carregado somente pelos comandos específicos do Turso. O `backend/.env` e o SQLite local continuam disponíveis para `npm run dev`, desde que você não configure variáveis do Turso nesse ambiente local.

## 3. Preparar tabelas e criar o SuperAdmin

```sh
npm run preparar:turso
```

O comando cria as tabelas ausentes, aplica as migrações de acesso e status das vendas e registra a versão do esquema. Execute novamente se houver uma falha de conexão; as etapas são feitas para permitir repetição.

Se o banco ainda não tiver SuperAdmin:

```sh
npm run criar-superadmin:turso
```

Depois da criação, remova `SUPERADMIN_SENHA` de `.env.turso`. A senha fica armazenada como hash no banco. Para alterá-la depois, use o perfil no aplicativo; mudar a variável não troca a senha cadastrada.

Não existe cadastro público de SuperAdmin. No primeiro login de uma empresa nova, seu administrador continua recebendo o código da empresa, e-mail `primeiro@acesso.com` e senha temporária `123456`, com troca obrigatória de e-mail e senha.

## 4. Importar o repositório na Vercel

Envie os commits para seu repositório no GitHub. Os commits criados pelo assistente são locais; a conexão com sua conta e o envio ao GitHub não são feitos automaticamente.

Na [Vercel](https://vercel.com/), crie um projeto e importe **o repositório inteiro**, que contém `backend/` e `frontend/`.

Configure:

| Configuração | Valor |
| --- | --- |
| Framework Preset | Express |
| Root Directory | `backend` |
| Include source files outside of the Root Directory in the Build Step | **Ativado** |
| Node.js Version | 24.x |
| Install Command | `npm ci --include=dev` |
| Build Command | `npm run build:vercel` |
| Output Directory | Mantenha o padrão do framework |

Os comandos de instalação e build já estão em `backend/vercel.json`. A opção de incluir arquivos fora da pasta raiz é necessária: o build lê `frontend/` e gera `backend/public/app/`. Essa pasta gerada não precisa ser enviada ao Git.

A Vercel reconhece o Express exportado em `backend/src/app.ts`. Os arquivos de `public/` são entregues pela infraestrutura estática da plataforma; consulte a [documentação de Express na Vercel](https://vercel.com/docs/frameworks/backend/express) e a [configuração de pastas em monorepositórios](https://vercel.com/docs/monorepos/monorepo-faq).

## 5. Cadastrar variáveis na Vercel e publicar

Nas variáveis de ambiente do projeto, configure para **Production**:

| Variável | Conteúdo |
| --- | --- |
| `TURSO_DATABASE_URL` | A mesma URL usada na preparação |
| `TURSO_AUTH_TOKEN` | O token de leitura e escrita desse banco |
| `JWT_SECRET` | O segredo aleatório gerado no passo 2 |

Essas variáveis pertencem ao backend. Não as coloque em arquivos JavaScript do frontend. Não cadastre `SUPERADMIN_SENHA` nem `SQLITE_PATH` na Vercel; `VERCEL` é definido pela própria plataforma.

Se habilitar ambientes de Preview, use outro banco e outro segredo para testes. Sem as variáveis necessárias, a API de Preview não inicia.

Clique em **Deploy**. Acesse o endereço fornecido, por exemplo `https://seu-projeto.vercel.app`. A raiz redireciona para o login; as páginas continuam em `/app/` e a API na mesma origem. Não é necessário alterar URLs do frontend ou configurar CORS para esse formato de publicação.

Depois de alterar variáveis no painel, faça um novo deploy para aplicá-las.

## 6. Conferir a publicação

1. Abra o endereço online e entre pela opção **SuperAdmin**, com o e-mail e a senha criados ou importados.
2. Crie uma empresa, guarde o código apresentado e faça o primeiro acesso do administrador. Troque e-mail e senha, depois entre novamente.
3. Cadastre um cliente e um produto com estoque 10. Crie uma venda de 2 unidades: ela deve ficar **pendente**, com estoque 8.
4. Marque essa venda como **paga**: o estoque deve continuar em 8.
5. Cancele a venda: o estoque deve voltar a 10. Uma segunda tentativa de cancelamento não pode devolver estoque novamente.
6. Crie outra venda pendente, altere a quantidade e confira o estoque e o total. Confira também que usuários de outra empresa não veem esses dados.
7. Teste a troca de senha no perfil e o encerramento das sessões antigas.
8. No celular, acesse o endereço HTTPS e use **Instalar app**. Confira login, consultas e uma venda no aplicativo instalado.

O PWA continua precisando de conexão para autenticar, consultar e salvar. Sem internet ele mostra a tela de reconexão; não registra vendas offline nem sincroniza operações pendentes.

## Verificações locais e manutenção

```sh
npm run build:vercel
npm run test:acesso
npm run test:vendas
npm run test:frontend
npm run test:turso
npm run test:publicacao
```

`test:turso` executa os fluxos de acesso e vendas com o adaptador real e um banco libSQL temporário local. Não acessa sua conta Turso e não mede latência da rede. `test:publicacao` confere a cópia dos arquivos públicos e os caminhos do PWA; o deploy real ainda precisa do teste manual acima.

Na Vercel, a API apenas verifica se o banco foi preparado. Não executa migrações a cada inicialização. Quando uma atualização mudar o esquema, execute o comando de preparação correspondente antes de publicar a nova versão.

Se a API responder **503 / Banco indisponível**, confira URL, token e conectividade, execute `npm run preparar:turso` e faça **Redeploy**. A verificação de inicialização fica guardada durante a vida da função, por isso é necessário reiniciá-la após corrigir uma falha inicial.

Se o build informar que não encontrou `frontend/`, confira a Root Directory e a opção de incluir arquivos externos. Se uma alteração somente no frontend não gerar um deploy automático, confira as configurações de detecção de mudanças do projeto ou faça um novo deploy manualmente.

As transações de escrita mantêm venda e estoque na mesma operação. O [SDK libSQL](https://docs.turso.tech/sdk/ts/reference) impõe um limite de tempo às transações remotas; escolha regiões próximas e teste vendas com a quantidade de itens que você pretende usar. Uma falha na transação não deve deixar uma venda parcialmente gravada.

Os limites e condições de gratuidade são os exibidos nas suas contas. Acompanhe o consumo nos painéis da Vercel e do Turso.
