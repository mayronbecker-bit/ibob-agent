# Controle de acesso

Data: 2026-05-16

## Objetivo

Proteger o dashboard publicado enquanto o produto ainda nao tem autenticacao completa com banco, usuarios e sessoes.

## Implementacao atual

O app usa HTTP Basic Auth no servidor Node customizado:

```text
apps/web/server.js
```

Essa camada roda antes das paginas e protege as rotas do dashboard lendo as variaveis de ambiente em runtime.

Observacao: a primeira versao usava `apps/web/src/proxy.ts`, mas ela foi substituida porque a Hostinger retornou 503 apos o deploy protegido, indicando que o proxy do Next nao recebeu as variaveis no momento esperado.

## Variaveis de ambiente

Configurar na Hostinger:

```text
BASIC_AUTH_ENABLED=true
BASIC_AUTH_USERNAME=<usuario escolhido>
BASIC_AUTH_PASSWORD=<senha forte escolhida>
```

Nao colocar usuario/senha reais em arquivos do repositorio.

## Comportamento

- Em producao, a protecao fica ativa por padrao.
- Se `BASIC_AUTH_ENABLED=false`, a protecao e desativada.
- Se estiver em producao e faltar usuario ou senha, o app responde `503 Authentication is not configured`.
- Com usuario/senha incorretos, o app responde `401 Authentication required`.
- Com usuario/senha corretos, o dashboard carrega normalmente.

## Status de publicacao

Validado em 2026-05-16:

- A primeira versao protegida chegou a retornar HTTP 401, mas depois apresentou HTTP 503 na Hostinger.
- A correcao v8 moveu a protecao para `apps/web/server.js` para usar variaveis de ambiente em runtime.
- A v8 foi reimplantada e validada em `https://adsia.ia.br/` e `https://adsia.ia.br/settings`: ambas as rotas retornam HTTP 401 sem credenciais, com `WWW-Authenticate: Basic realm="iBob Agent"`.

## Escopo

Protege as rotas do dashboard, incluindo:

- `/`
- `/agent`
- `/data-trust`
- `/proposals`
- `/approvals`
- `/execution`
- `/memory`
- `/roadmap`
- `/settings`

Arquivos estaticos do Next.js e imagens publicas sao ignorados pelo servidor de autenticacao para manter o carregamento da interface.

## Evolucao planejada

Esta e uma protecao temporaria. Em 2026-05-17, o app recebeu uma primeira camada de Supabase Auth em paralelo:

- `/login` usa email/senha do Supabase.
- Rotas do dashboard exigem sessao Supabase no browser.
- O Basic Auth continua ativo como barreira externa enquanto o login real e RLS sao validados.
- A v9 mantem as duas camadas: Basic Auth externo na Hostinger e Supabase Auth dentro do app.

Na fase de fundacao real de dados, substituir por:

- Supabase Auth.
- Usuarios por cliente.
- Roles: admin, approver, viewer.
- Row Level Security por `clientId`.
- Logs de acesso e auditoria.
