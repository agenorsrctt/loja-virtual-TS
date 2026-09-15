# SuperAdmin e primeiro acesso

## 1. Criar seu único superAdmin

Na nova estrutura, configure `backend/.env` com valores escolhidos por você. Os comandos abaixo podem ser executados na raiz do repositório:

```dotenv
JWT_SECRET="seu-segredo-aleatorio-longo"
SUPERADMIN_EMAIL="seu-email@exemplo.com"
SUPERADMIN_SENHA="sua-senha-inicial-exclusiva"
```

Substitua os exemplos. A senha deve ter no mínimo 12 caracteres e no máximo 72 bytes em UTF-8. Não use as senhas dos testes como credenciais reais.

Execute na raiz do projeto:

```sh
npm run criar-superadmin
```

O comando prepara as tabelas e migrações, salva a senha com bcrypt e cria o registro global `SUPER_ADMIN` com ID 1. A restrição do banco impede um segundo registro, inclusive em criações simultâneas. Executar novamente não troca a senha nem recria a conta.

Remova `SUPERADMIN_SENHA` do `.env` após a criação. O login consulta o hash no banco; alterar a variável depois não altera a senha da conta. Não há rota pública para criar outro superAdmin.

**A conta real não foi criada durante a implementação.** Os testes criaram contas somente em bancos temporários. Você deve executar o comando com suas próprias credenciais.

## 2. Iniciar a API e entrar como superAdmin

```sh
npm run dev
```

`POST http://localhost:3000/administracao/login`

```json
{
  "email": "seu-email@exemplo.com",
  "senha": "sua-senha-inicial-exclusiva"
}
```

A resposta contém `token`. Use-o como Bearer Token para gerenciar empresas. O token global dura uma hora e não dá acesso às rotas de clientes, produtos, usuários ou vendas das empresas.

## 3. Criar uma empresa e seu primeiro admin

`POST http://localhost:3000/empresas`

Cabeçalho: `Authorization: Bearer TOKEN_DO_SUPERADMIN`.

```json
{
  "empresa": "Minha loja",
  "cnpj": "12345678000190"
}
```

A resposta **201** contém:

```json
{
  "mensagem": "Empresa e administrador criados. Guarde as credenciais temporárias.",
  "dados": {
    "id": 1,
    "empresa": "Minha loja",
    "cnpj": "12345678000190",
    "status": "ativo",
    "administrador": {
      "id": 1,
      "email": "admin-valor-aleatorio@primeiro-acesso.invalid",
      "senha_temporaria": "valor-aleatorio-gerado-pelo-servidor",
      "primeiro_acesso": true
    }
  }
}
```

IDs e credenciais são exemplos. Guarde e entregue ao responsável o ID da empresa, o e-mail temporário e a senha temporária retornados. A senha aparece apenas nessa resposta; no banco fica o hash. O e-mail temporário é um identificador de login, não uma caixa de correio, e nenhum e-mail é enviado automaticamente.

Empresa e administrador são criados na mesma transação. CNPJ duplicado retorna **409** sem deixar um usuário ou empresa parcial.

Todas as rotas `/empresas` exigem superAdmin: listar, buscar, criar, alterar e inativar.

## 4. Login temporário do admin

`POST http://localhost:3000/usuarios/login`

```json
{
  "empresa_id": 1,
  "email": "email-temporario-retornado",
  "senha": "senha-temporaria-retornada"
}
```

Resposta:

```json
{
  "token": "TOKEN_TEMPORARIO",
  "primeiro_acesso": true
}
```

O token temporário dura **15 minutos** e só permite concluir o primeiro acesso. Todas as operações empresariais permanecem bloqueadas. Se ele expirar antes da troca, faça o login temporário novamente.

## 5. Trocar obrigatoriamente e-mail e senha

`PATCH http://localhost:3000/usuarios/primeiro-acesso`

Cabeçalho: `Authorization: Bearer TOKEN_TEMPORARIO`.

```json
{
  "novo_email": "administrador@minhaloja.com",
  "nova_senha": "uma-nova-senha-exclusiva"
}
```

Ambos devem ser diferentes das credenciais temporárias. O e-mail deve ter formato válido e estar disponível na empresa. A senha deve cumprir o mínimo de 12 caracteres e o máximo de 72 bytes. Essa verificação não comprova posse da caixa de e-mail; não há envio de confirmação nesta implementação.

Em caso de sucesso (**200**), o sistema salva o hash da senha, desmarca `primeiro_acesso` e invalida todos os tokens temporários anteriores. E-mail e senha mudam juntos: conflito ou falha não libera o acesso parcialmente.

Faça **novo login** em `/usuarios/login`, com o mesmo `empresa_id`, o e-mail definitivo e a nova senha. A resposta terá `primeiro_acesso: false` e um token normal de uma hora.

Esse token libera as operações permitidas ao perfil dentro da própria empresa. Ele não permite administrar outras empresas ou acessar a administração global.

## 6. Alterar a senha do superAdmin

Faça login global e envie:

`PATCH http://localhost:3000/administracao/senha`

Cabeçalho: `Authorization: Bearer TOKEN_DO_SUPERADMIN`.

```json
{
  "senha_atual": "sua-senha-atual",
  "nova_senha": "sua-nova-senha-exclusiva"
}
```

A senha atual é obrigatória. A nova deve ser diferente e cumprir a mesma regra de tamanho.

Após **200**, todos os tokens anteriores do superAdmin deixam de funcionar, inclusive o usado na troca. Faça novo login global com o mesmo e-mail e a nova senha. A senha antiga não será mais aceita. Esse endpoint não altera a senha de usuários empresariais.

## Bancos e usuários já existentes

- A inicialização aguarda as tabelas e a migração antes de liberar a API.
- A migração adiciona `SUPER_ADMIN`, o controle `MIGRACOES` e `USUARIOS.versao_token`; também adiciona `primeiro_acesso` caso a coluna não exista.
- Admins antigos com e-mail `mudar@email.com` são marcados para primeiro acesso. Se a senha antiga estiver em texto puro exatamente como `123456`, ela é convertida para hash. Hashes existentes são preservados.
- A marcação dos admins legados ocorre uma única vez. Outras contas e senhas existentes não são redefinidas.
- Tokens emitidos antes dessa atualização não são aceitos pelo novo formato; faça novo login.
- Cada requisição autenticada consulta o estado atual da conta e da empresa. Contas inativas são bloqueadas mesmo com JWT ainda não expirado.
- Alterações no cadastro de usuário incrementam a versão da sessão, invalidando seus tokens anteriores.
- O login empresarial agora busca pelo e-mail **e pelo ID da empresa**.
- A migração roda quando você inicia a API ou executa o comando inicial. Os testes não migram seu banco real.

## Testes

```sh
npm run build -- --noEmit
npm run test:acesso
npm run test:vendas
```

Os testes usam bancos temporários. Cobrem o comando inicial, superAdmin único, migração repetida, autorização global, credenciais temporárias, troca obrigatória, conflitos, requisições simultâneas, revogação dos tokens, alteração de senha e contas inativas. Os testes de vendas também usam o novo formato de sessão.

Depois do primeiro acesso, siga [o roteiro de vendas](testar-vendas.md).
