# Contador privado de visitas

O superadmin consulta o total em **Suas empresas → Visitas ao site**. Contas de empresas não têm acesso à consulta, protegida no backend.

A página de login registra uma visita por sessão da aba, usando uma chave aleatória no `sessionStorage`. Recarregar a página, sair da conta ou repetir a requisição com a mesma chave não incrementa o total. Uma nova sessão pode contar novamente a mesma pessoa; não é uma medição de pessoas únicas. Abas duplicadas podem compartilhar a chave inicial. Não são armazenados IP, e-mail ou dados de conta.

O contador começa na ativação: não recupera visitas anteriores. JavaScript desativado, armazenamento bloqueado ou falhas de rede podem impedir registros. A rota de registro é pública, por isso automações podem inflar a contagem; o valor é indicativo.

## Publicação

1. Com as credenciais do Turso configuradas no ambiente existente, execute na raiz `npm run preparar:turso` **antes de publicar**. A preparação adiciona `VISITAS` e a migração `asr_schema_v2_visitas`, preservando os cadastros existentes.
2. Publique a nova versão na Vercel. A API exige essa migração; sem ela, retorna 503.
3. Abra o login e entre como superadmin. Confira o total em **Suas empresas**.

Localmente, a tabela é criada automaticamente ao iniciar a aplicação. Os registros ficam no banco e sobrevivem a novas publicações.
