# EMPRESAS

### Criar empresa

**POST** `/empresas`

Body:

```json
{
  "empresa": "TechStore",
  "cnpj": "12345678000199"
}
```

O `status` é definido automaticamente como `"ativo"`.

---

### Listar empresas

**GET** `/empresas`

Não precisa de body.

---

### Buscar empresa

**GET** `/empresas/1`

Não precisa de body.

O `1` é o ID da empresa.

---

### Alterar empresa

**PATCH** `/empresas/1`

Body, por exemplo:

```json
{
  "empresa": "TechStore Bahia",
  "cnpj": "12345678000199",
  "status": "ativo"
}
```

Pode enviar somente os campos que deseja alterar.

---

### Inativar empresa

Usar a rota de inativação definida no módulo de empresas.

O ID identifica a empresa que será inativada.

---

# LOGIN

### Fazer login

**POST** `/usuarios/login`

Body:

```json
{
  "empresa_id": 1,
  "email": "admin@email.com",
  "senha": "123456"
}
```

O servidor:

```text
empresa_id + email
        ↓
busca o usuário no banco
        ↓
confere a senha com bcrypt
        ↓
gera o JWT
        ↓
JWT guarda:
id
empresa_id
email
tipo
```

Depois copie o token retornado.

Nas próximas requisições protegidas:

```text
Thunder Client
→ Auth
→ Bearer Token
→ cole o token
```

---

# USUÁRIOS

### Criar usuário

**POST** `/usuarios`

Precisa do **Bearer Token**.

Body:

```json
{
  "nome": "João",
  "tipo": "colaborador",
  "email": "joao@email.com",
  "senha": "123456"
}
```

Não precisa enviar:

```json
{
  "empresa_id": 1
}
```

porque agora:

```text
empresa_id
↓
JWT
↓
res.locals.usuario.empresa_id
```

O usuário será criado automaticamente na empresa do usuário autenticado.

---

### Listar usuários

**GET** `/usuarios`

Precisa do **Bearer Token**.

Não precisa de body.

O backend pega:

```text
empresa_id → JWT
```

e executa a busca somente dos usuários daquela empresa.

---

### Buscar usuário

**GET** `/usuarios/5`

Precisa do **Bearer Token**.

Não precisa de body.

```text
5 → ID do usuário procurado
empresa_id → JWT
```

O banco procura:

```text
empresa_id + id
```

Assim um usuário da empresa 1 não consegue consultar um usuário da empresa 2 usando apenas outro ID.

---

### Alterar usuário

**PATCH** `/usuarios/5`

Precisa do **Bearer Token**.

Como você decidiu enviar os dados do usuário pelo body, pode testar:

```json
{
  "id": 5,
  "nome": "João Silva",
  "tipo": "colaborador",
  "email": "joaosilva@email.com",
  "status": "ativo"
}
```

Não precisa alterar todos os campos. Por exemplo, somente nome:

```json
{
  "id": 5,
  "nome": "João Silva"
}
```

Ou senha:

```json
{
  "id": 5,
  "senha": "novaSenha123"
}
```

A nova senha deve passar pelo `gerarHash()` antes do UPDATE.

A empresa continua vindo do JWT:

```text
id do usuário → body
empresa_id → JWT
dados novos → body
```

---

### Inativar usuário

**PATCH** `/usuarios/5/inativar`

Precisa do **Bearer Token**.

Não precisa de body.

```text
5 → ID do usuário que será inativado
empresa_id → JWT
```

O backend faz:

```text
status = "inativo"
```

sem excluir o usuário do banco.

---

# REGRA PRINCIPAL PARA OS TESTES

Antes do login:

```text
empresa_id → body
email      → body
senha      → body
```

Depois do login:

```text
empresa_id → JWT
tipo       → JWT
id logado  → JWT
```

Então, nas rotas protegidas, você não deve precisar ficar enviando:

```json
{
  "empresa_id": 1
}
```

O token é quem identifica a empresa.

Para identificar **outro usuário**, você utiliza o ID:

```text
GET   /usuarios/5
PATCH /usuarios/5
```

E o banco sempre combina:

```text
empresa_id do JWT
+
id do usuário solicitado
```

Essa combinação é uma das bases do isolamento multiempresa.
