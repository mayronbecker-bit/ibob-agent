# Decisoes

Registro de decisoes tecnicas do projeto.

## 2026-05-11 - Estrutura base neutra

Contexto:

O workspace estava vazio e sem repositorio Git.

Decisao:

Criar uma estrutura base neutra para app, pacotes compartilhados, infraestrutura, scripts, testes e documentacao.

Motivo:

Permitir organizacao inicial sem escolher framework ou cloud antes de entender o produto.

Status:

Aceita.

## 2026-05-19 - Fundacao de auditoria por cliente

Contexto:

O piloto ja registra approvals, decision_memory e execution_logs, mas ainda falta uma trilha generica de eventos para seguranca, produto e operacao.

Decisao:

Preparar a migration `audit_events` com `client_id`, usuario ator opcional, tipo de evento, severidade, entidade relacionada, descricao, metadata e timestamp. A leitura segue RLS por cliente, e a escrita inicial fica restrita a owners/admins.

Motivo:

Antes de conectar integracoes externas ou execucao controlada, o produto precisa explicar o que aconteceu, quem fez, quando ocorreu e qual entidade foi afetada.

Consequencias:

- A migration fica versionada localmente antes de ser aplicada no Supabase.
- Auditoria vira parte explicita do hardening do produto piloto no Roadmap.
- Eventos de Decision Engine, rule_validator e Execution Engine poderao usar essa base em etapas futuras.

Status:

Aceita e aplicada no Supabase remoto em 2026-05-19.

## 2026-05-19 - Audit UI no produto

Contexto:

A tabela `audit_events` ja esta aplicada no Supabase remoto com RLS por cliente, mas ainda faltava uma superficie no produto para o usuario acompanhar os eventos.

Decisao:

Criar a rota `/audit`, adicionar item no menu lateral e ler eventos reais do Supabase usando a sessao autenticada. A tela deve mostrar severidade, ator, tipo de evento, entidade, metadata resumida e fallback controlado para mock.

Motivo:

Auditoria so vira valor operacional quando fica visivel para o usuario. Essa tela prepara o produto para demonstracao, suporte e futuras etapas de governanca antes das integracoes externas.

Consequencias:

- `/audit` passa a fazer parte das rotas protegidas do produto.
- Eventos reais sao limitados por RLS ao cliente do usuario logado.
- A etapa de hardening do Roadmap passa a incluir UI de auditoria.

Status:

Aceita.

## 2026-05-18 - Headers defensivos no servidor Node

Contexto:

O app roda na Hostinger por `server.js`, que tambem aplica o Basic Auth temporario antes de entregar as rotas do Next.js.

Decisao:

Adicionar headers defensivos diretamente no servidor Node: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e `Strict-Transport-Security` quando a requisicao chegar por HTTPS.

Motivo:

Reduzir riscos comuns de navegador, como clickjacking, MIME sniffing, exposicao excessiva de origem por referrer e uso indevido de recursos sensiveis como camera, microfone, geolocalizacao e pagamento.

Consequencias:

- As respostas protegidas por Basic Auth e as rotas do app recebem o mesmo baseline de seguranca.
- Nao foi adicionada Content Security Policy nesta etapa para evitar quebrar scripts gerados pelo Next.js sem uma auditoria especifica.
- O Roadmap registra este item como parte do hardening do produto piloto.

Status:

Aceita.

## 2026-05-18 - Estados de tela padronizados

Contexto:

As telas conectadas ao Supabase ja tinham fallback controlado para mock, mas cada uma comunicava falha, ausencia de dados ou fallback de forma diferente.

Decisao:

Criar componentes reutilizaveis para aviso de estado de dados e estado vazio. Aplicar o padrao nas telas principais: dashboard, Data Trust, propostas, aprovacoes, memoria e settings.

Motivo:

Melhorar confianca operacional. O usuario precisa saber quando esta vendo dado real, dado mockado, lista vazia ou falha temporaria de leitura, especialmente antes de transformar o piloto em produto vendavel.

Consequencias:

- Fallbacks ficam explicitos.
- Listas vazias deixam de parecer tela quebrada.
- O Roadmap registra este item como parte do hardening do produto piloto.

Status:

Aceita.

## 2026-05-18 - Redirect pos-login restrito a rotas internas

Contexto:

O formulario de login aceita o parametro `next` para devolver o usuario a rota que ele tentou acessar antes de autenticar.

Decisao:

Validar o valor de `next` no cliente e aceitar apenas caminhos internos relativos do app. URLs externas, caminhos iniciados por `//`, valores com quebra de linha e a propria rota `/login` caem para `/`.

Motivo:

Evitar redirecionamento aberto apos login e reduzir risco de phishing ou navegacao para destinos nao controlados pelo produto.

Consequencias:

- O fluxo normal `/login?next=/alguma-rota` continua funcionando.
- Links externos em `next` deixam de ser aceitos.
- Este e o primeiro item concluido do hardening do produto piloto.

Status:

Aceita.

## 2026-05-18 - Integracoes externas como fase final

Contexto:

O piloto ja tem autenticacao, RLS, dados reais no Supabase, dashboard, Data Trust, propostas, aprovacoes, memoria e Roadmap publicados. Ainda assim, o produto precisa ficar mais robusto antes de conectar contas externas de midia, analytics, CRM ou ecommerce.

Decisao:

Adiar as integracoes externas para as fases finais e priorizar agora o hardening do produto piloto: seguranca, estados de erro, auditoria, testes, backup, documentacao operacional, experiencia de uso, Decision Engine supervisionado, rule_validator e preparacao comercial.

Motivo:

Reduzir risco operacional e financeiro. O produto pode evoluir usando dados reais ja persistidos, mocks controlados e importacoes manuais antes de tocar APIs externas. Isso deixa a iBob mais segura e tambem prepara uma base vendavel e escalavel.

Consequencias:

- A etapa "Integracoes em modo leitura" deixa de ser o proximo marco e passa a ser fase final antes da execucao controlada.
- O Roadmap passa a destacar "Hardening do produto piloto" como etapa em andamento.
- Decision Engine e rule_validator podem ser validados sem credenciais externas.
- Nenhuma automacao deve executar acoes externas sem aprovacao humana, logs e rollback desenhados.

Status:

Aceita.

## Pendentes

- Banco de dados.
- Fluxo de CI/CD.
- Estrategia de ambientes: local, staging e producao.
- Modelo de multi-cliente: single-tenant inicial, multi-tenant futuro ou instancias isoladas.
- Provedor final dos workers do agente, caso sejam separados da Hostinger.

## 2026-05-18 - Roadmap como registro vivo

Contexto:

O usuario reforcou que o Roadmap deve ser atualizado a cada passo do projeto.

Decisao:

Toda etapa tecnica concluida deve atualizar tambem o Roadmap operacional do produto, incluindo status, descricao e proximo marco quando aplicavel.

Motivo:

Manter a execucao tecnica alinhada ao plano vendavel e escalavel do produto, evitando que o app evolua sem que o usuario enxergue claramente o progresso e as proximas dependencias.

Consequencias:

- Alteracoes futuras devem revisar `/roadmap` junto com documentacao e changelog.
- O Roadmap deve refletir o estado real validado em producao, nao apenas o plano inicial.
- Commits de feature devem incluir ajuste de Roadmap quando mudarem o estado do produto.

Status:

Aceita.

## 2026-05-11 - Git local

Contexto:

O workspace nao tinha repositorio Git.

Decisao:

Inicializar Git local na branch `main`, sem criar commit automatico.

Motivo:

Manter historico desde o inicio e permitir que o primeiro snapshot seja revisado antes de commit.

Status:

Aceita.

## 2026-05-12 - iBob como piloto de produto

Contexto:

O usuario informou que, depois de validar com a iBob, pretende transformar a solucao em um produto vendavel e escalavel.

Decisao:

Tratar a iBob como primeiro piloto/MVP e manter o core do produto preparado para ser reutilizado por outros clientes.

Motivo:

Evitar decisoes iniciais que prendam o sistema a um unico cliente, dominio, fluxo ou configuracao, reduzindo retrabalho quando o produto precisar ser vendido e escalado.

Consequencias:

- Configuracoes especificas da iBob devem ficar separadas do core.
- Regras de negocio devem ser parametrizaveis quando fizer sentido.
- Arquitetura deve considerar autenticacao, permissoes, isolamento de dados, billing, logs e onboarding como proximos marcos.
- Hostinger continua adequada para validacao inicial, mas a portabilidade deve ser preservada.

Status:

Aceita.

## 2026-05-12 - Stack Next.js

Contexto:

O usuario escolheu Next.js para o aplicativo.

Decisao:

Criar o app principal em `apps/web` usando Next.js, TypeScript, App Router, Tailwind CSS e ESLint.

Motivo:

Next.js e suportado pela Hostinger como aplicacao Node.js e permite evoluir frontend e rotas server-side no mesmo app.

Status:

Aceita.

## 2026-05-12 - Cloud Hostinger

Contexto:

O usuario escolheu Hostinger como destino de hospedagem.

Decisao:

Preparar o projeto para deploy supervisionado via Hostinger Node.js Web Apps, preferencialmente por GitHub integration, mantendo alternativa por ZIP da pasta `apps/web`.

Motivo:

A documentacao atual da Hostinger informa suporte a Next.js em Node.js Web Apps, com deploy por GitHub ou upload de arquivos.

Status:

Aceita.

## 2026-05-12 - Blueprint Claude como plano funcional

Contexto:

O usuario forneceu o pacote `iBob_Projeto_Agente_Trafego.zip`, criado anteriormente pela Claude, contendo blueprint DOCX, arquitetura HTML interativa e guia HTML passo a passo.

Decisao:

Importar o pacote em `docs/claude-blueprint/` e adotar o blueprint como referencia funcional e arquitetural do agente de trafego pago.

Adaptacao:

O blueprint original sugere Supabase, Railway e Vercel. A decisao atual do projeto usa Hostinger como hospedagem inicial do app Next.js. Supabase e workers separados continuam como opcoes previstas para as proximas fases.

Motivo:

Preservar o planejamento ja validado, evitar retrabalho e manter uma rota clara para transformar o piloto iBob em produto vendavel.

Status:

Aceita.

## 2026-05-12 - MVP local em modo seguro

Contexto:

Antes do deploy na Hostinger, o usuario pediu para montar o projeto e rodar localmente.

Decisao:

Implementar um MVP navegavel em Next.js com dados mockados e fluxo do agente em modo seguro.

Motivo:

Permitir validacao visual e operacional do produto antes de conectar APIs reais, banco, secrets ou execucoes em contas de midia.

Consequencias:

- Google Ads, Meta Ads, GA4, Orbita, CRM, Supabase e Claude API ficam simulados nesta fase.
- Nenhuma acao real e executada.
- O fluxo de aprovacao humana e `rule_validator` ja aparecem na interface para orientar a evolucao.

Status:

Aceita.

## 2026-05-16 - Fundacao de dados local

Contexto:

Depois do MVP publicado, o proximo passo foi preparar a base para transformar os mocks em dados reais sem prender o produto apenas a iBob.

Decisao:

Criar contratos canonicos de dominio em `apps/web/src/lib/domain/types.ts` e separar a configuracao especifica da iBob em `apps/web/src/config/clients/ibob.ts`.

Motivo:

Permitir migracao futura para Supabase, Row Level Security, multi-cliente e auditoria sem reescrever as telas do dashboard.

Consequencias:

- O MVP continua usando dados mockados.
- Cada entidade persistente passa a ter `clientId` para isolamento futuro por cliente.
- A rota `/settings` mostra a configuracao ativa do piloto e reforca o modo `DRY_RUN`.
- Supabase ainda nao foi integrado; esta decisao apenas prepara o contrato.

Status:

Aceita.

## 2026-05-16 - Controle de acesso temporario

Contexto:

O dashboard publicado em `adsia.ia.br` ficou acessivel publicamente durante a fase de MVP.

Decisao:

Adicionar protecao temporaria por HTTP Basic Auth usando `apps/web/src/proxy.ts`, com usuario e senha definidos apenas por variaveis de ambiente.

Motivo:

Reduzir exposicao publica imediatamente, sem antecipar a implementacao completa de autenticacao com Supabase Auth.

Consequencias:

- A versao protegida exige `BASIC_AUTH_USERNAME` e `BASIC_AUTH_PASSWORD` na Hostinger.
- Se as credenciais nao forem configuradas em producao, o app bloqueia acesso com status 503.
- Esta abordagem e temporaria e deve ser substituida por autenticacao real com usuarios, roles e RLS.

Status:

Aceita.

## 2026-05-16 - Autenticacao temporaria em runtime Node

Contexto:

A versao protegida por `apps/web/src/proxy.ts` chegou a validar HTTP 401 sem credenciais, mas depois a Hostinger passou a retornar HTTP 503 mesmo com variaveis configuradas no painel.

Decisao:

Substituir o proxy do Next.js por `apps/web/server.js`, mantendo HTTP Basic Auth temporario e lendo `BASIC_AUTH_ENABLED`, `BASIC_AUTH_USERNAME` e `BASIC_AUTH_PASSWORD` em runtime no processo Node.

Motivo:

Reduzir dependencias do runtime especifico do proxy do Next.js na Hostinger e manter a protecao simples enquanto a autenticacao real do produto ainda nao foi implementada.

Consequencias:

- `npm run start` passa a executar `node server.js`.
- O pacote ZIP da Hostinger precisa incluir `server.js`.
- A protecao continua temporaria e sera substituida por Supabase Auth, roles e isolamento por cliente.

Status:

Aceita.

## 2026-05-16 - Supabase como fundacao de Auth e banco

Contexto:

Com o piloto publicado e protegido, o proximo passo e substituir mocks por dados reais e preparar o produto para multiplos clientes.

Decisao:

Adotar Supabase como fundacao inicial de autenticacao, banco Postgres e Row Level Security, mantendo Hostinger para hospedar o app Next.js.

Motivo:

Supabase entrega Auth, Postgres, policies de RLS e fluxo de migrations com baixa friccao para o MVP, sem prender o app a um unico cliente.

Consequencias:

- O Basic Auth da Hostinger continua temporario ate o login real ser validado.
- O schema inicial fica versionado em `infra/supabase/migrations`.
- Todos os dados persistentes devem carregar `client_id` para isolamento por cliente.
- Secrets do Supabase ficam apenas no ambiente local/Hostinger, nunca no Git.

Status:

Aceita.
