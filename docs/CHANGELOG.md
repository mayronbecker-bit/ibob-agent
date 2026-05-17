# Changelog

## 2026-05-11

- Criada estrutura base do projeto.
- Criados documentos iniciais de setup, deploy, decisoes e historico.
- Criados `.gitignore` e `.env.example`.
- Inicializado repositorio Git na branch `main`.
- Criado plano inicial em `docs/INITIAL_PLAN.md`.

## 2026-05-12

- Criado app Next.js em `apps/web`.
- Instaladas dependencias do Next.js, React, TypeScript, Tailwind CSS e ESLint.
- Criado `package.json` no root com scripts delegando para `apps/web`.
- Criada documentacao especifica de Hostinger em `docs/HOSTINGER.md`.
- Atualizados setup, deploy, decisoes e README para Next.js + Hostinger.
- Substituida tela padrao do Next.js por tela inicial do iBob Agent.
- Validados lint e build pelo root do projeto.
- Validado comando `hostinger:build` com instalacao limpa via `npm ci`.
- Registrada observacao de auditoria npm sem aplicar correcao forcada.
- Criada estrategia de produto tratando a iBob como piloto/MVP para futuro produto escalavel.
- Criado checklist operacional para o primeiro deploy na Hostinger.
- Importado pacote da Claude em `docs/claude-blueprint/`.
- Criada integracao do blueprint em `docs/CLAUDE_BLUEPRINT_INTEGRATION.md`.
- Implementado MVP local do dashboard com dados mockados, Data Trust Layer, propostas, aprovacao humana, memoria de decisao e roadmap.
- Criada documentacao do MVP local em `docs/LOCAL_MVP.md`.
- Criado script e pacote local para deploy por ZIP na Hostinger quando o import Git nao detectar monorepo.
- Ajustado empacotamento do ZIP da Hostinger para usar `tar.exe` e evitar erro de permissao em Linux.
- Ajustado novamente o ZIP da Hostinger para manter caminhos na raiz e permissoes Unix explicitas.
- Ajustado ZIP da Hostinger para conter apenas entradas de arquivos, com `package.json` como primeira entrada, e validado build apos extracao temporaria.
- Publicado MVP em `adsia.ia.br` e validado status HTTP 200.
- Implementada fundacao de dados local com contratos de dominio, configuracao da iBob e pagina `/settings`.
- Publicada atualizacao da fundacao de dados em `https://adsia.ia.br`, incluindo rota `/settings`.
- Implementado controle de acesso temporario por HTTP Basic Auth via Next.js Proxy.
- Publicada versao protegida em `https://adsia.ia.br`; acesso sem credenciais retorna HTTP 401.
- Substituido o Basic Auth via Next.js Proxy por servidor Node customizado para corrigir 503 na Hostinger.
- Validada a reimplantacao v8 na Hostinger com HTTP 401 sem credenciais em `/` e `/settings`.
- Preparada fundacao Supabase com dependencias, helpers SSR, migration inicial, RLS por cliente e documentacao operacional.
- Aplicada a migration inicial no projeto Supabase `euedumaappfxqabgdizi` e validado historico remoto.
- Preparada migration para vincular o primeiro usuario autenticado como `owner` do cliente `client-ibob`.
- Aplicada e validada a migration do owner inicial para `client-ibob`.
- Implementado login/logout via Supabase Auth e protecao de dashboard por sessao no browser.
- Preparada migration para adicionar novo usuario autenticado como `owner` de `client-ibob`.
- Aplicada e validada a migration do novo owner de `client-ibob`.
- Removido manualmente no Supabase o owner antigo apos validacao do novo login.
- Gerado pacote Hostinger v9 com Supabase Auth e validado build empacotado.
