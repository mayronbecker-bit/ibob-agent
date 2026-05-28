# Hostinger

Este projeto usa Next.js em `apps/web` e esta preparado para deploy supervisionado na Hostinger.

## Base oficial consultada

- Hostinger Node.js Web Apps: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- Hostinger Next.js Hosting: https://www.hostinger.com/web-apps-hosting/nextjs-hosting

## Requisitos

De acordo com a documentacao da Hostinger consultada em 2026-05-12:

- Next.js e suportado como aplicacao frontend e backend.
- Node.js Web Apps estao disponiveis em planos Business Web Hosting e Cloud.
- VPS tambem suporta Node.js, mas exige configuracao manual.
- Versoes Node.js suportadas: 18.x, 20.x, 22.x e 24.x.
- Deploy pode ser feito por GitHub ou upload de ZIP.

## Configuracao local atual

- App Next.js: `apps/web`
- Node local: 24.x
- Gerenciador: npm
- Build local: `npm run build`
- Dev local: `npm run dev`
- Build direto no app: `npm --prefix apps/web run build`

## Caminho recomendado para Hostinger

Preferencia: GitHub integration no hPanel.

1. Subir este repositorio para GitHub.
2. No hPanel, ir em Websites e adicionar Node.js Web App.
3. Selecionar Import Git Repository.
4. Autorizar a Hostinger no GitHub.
5. Selecionar o repositorio.
6. Confirmar framework Next.js.
7. Configurar Node.js 24.x, se a opcao estiver disponivel.
8. Configurar variaveis em Environment Variables no hPanel.
9. Fazer deploy apenas apos validacao local e confirmacao do usuario.

## Erro de estrutura invalida no GitHub import

Se a Hostinger mostrar:

```text
Estrutura de projeto invalida ou framework nao compativel.
```

A causa mais provavel neste repositorio e o formato monorepo: o app Next.js fica em `apps/web`, enquanto o detector da Hostinger procura a estrutura do framework na raiz do repositorio.

Solucao imediata:

1. Usar deploy por ZIP.
2. Enviar `deploy/hostinger/ibob-agent-web-hostinger.zip`.
3. Configurar como Next.js.

Solucao posterior para GitHub integration:

- Criar um repositorio separado contendo apenas o conteudo de `apps/web`, ou
- Ajustar a estrutura para o Next.js ficar na raiz do repositorio.

Por enquanto, o ZIP e o caminho mais rapido e seguro.

## Build settings

Se a Hostinger aceitar o app em subpasta ou comandos customizados:

- Install command: `npm run hostinger:install`
- Build command: `npm run hostinger:build`
- Start command: `npm run hostinger:start`
- Output directory, se solicitado: `apps/web/.next`

Os comandos acima foram criados no `package.json` do root para facilitar deploy quando o repositorio inteiro for usado.

Se o hPanel nao lidar bem com monorepo:

1. Gerar ZIP da pasta `apps/web`.
2. Fazer upload desse ZIP no fluxo Node.js Web App.
3. Usar:
   - Build command: `npm run build`
   - Start command: `npm run start`
   - Output directory: `.next`

Na versao protegida, `npm run start` executa `node server.js`. Esse servidor inicia o Next.js e aplica HTTP Basic Auth usando as variaveis configuradas na Hostinger em runtime.

O ZIP pode ser gerado com:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-hostinger-zip.ps1
```

Observacao importante:

O ZIP deve ser gerado pelo script acima. Nao use `Compress-Archive` manualmente, pois ele pode gerar metadados de permissao que causam erro de leitura em pastas como `src/components` durante o build na Hostinger. Tambem nao use um ZIP que coloque todos os caminhos com prefixo `./` ou entradas explicitas de diretorio antes de `package.json`, porque o detector da Hostinger pode nao reconhecer a estrutura do Next.js.

## Secrets

Nao salvar secrets no Git.

Variaveis devem ser configuradas:

- Localmente em `.env`.
- Na Hostinger em Environment Variables.

## Controle de acesso

Antes de publicar versoes protegidas, configurar na Hostinger:

```text
BASIC_AUTH_ENABLED=true
BASIC_AUTH_USERNAME=<usuario escolhido>
BASIC_AUTH_PASSWORD=<senha forte escolhida>
```

Sem `BASIC_AUTH_USERNAME` e `BASIC_AUTH_PASSWORD`, a versao protegida bloqueia o acesso em producao com status 503. Se isso acontecer mesmo com as variaveis configuradas, reimplantar usando o ZIP v8 ou posterior, que usa `server.js` em vez do proxy do Next.js.

Detalhes: `docs/ACCESS_CONTROL.md`.

## Supabase Auth

A partir da v9, o app tambem exige sessao Supabase no dashboard. Antes de reimplantar a v9 na Hostinger, configurar estas variaveis de ambiente:

```text
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Essas variaveis precisam existir antes do build da Hostinger, pois sao usadas pelo cliente web.

## Pendencias antes do primeiro deploy

- Confirmar plano Hostinger: Business, Cloud ou VPS.
- Confirmar dominio ou URL temporaria.
- Confirmar se o deploy sera via GitHub ou ZIP.
- Confirmar variaveis de ambiente necessarias.
- Criar primeiro commit Git.
- Conectar repositorio remoto, se o caminho escolhido for GitHub.

Checklist operacional: `docs/FIRST_DEPLOY_CHECKLIST.md`.

## Validacao local

Validado em 2026-05-12:

- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run hostinger:build`

Observacao: se `npm ci` falhar localmente no Windows com arquivo em uso, parar o servidor dev antes de repetir o comando.

## Deploys realizados

- 2026-05-16: publicado MVP com fundacao de dados local e rota `/settings` em `https://adsia.ia.br`.
- 2026-05-16: publicada versao com HTTP Basic Auth; acesso anonimo retorna HTTP 401.
- 2026-05-16: corrigida protecao para rodar em `server.js`, evitando 503 causado por variaveis nao disponiveis no proxy do Next.js na Hostinger.
- 2026-05-16: reimplantada e validada a v8 com `server.js`; acesso anonimo em `/` e `/settings` retorna HTTP 401 com Basic Auth.
- 2026-05-17: gerado pacote v9 com login/logout via Supabase Auth, mantendo Basic Auth externo.
- 2026-05-17: v9 reimplantada em `https://adsia.ia.br` e validada pelo usuario com login Supabase. Acesso anonimo externo em `/` e `/login` continua retornando HTTP 401 por Basic Auth.
- 2026-05-17: gerado pacote v10 com `/settings` lendo usuario, membership, cliente e versao ativa do agente pelo Supabase.
- 2026-05-17: v10 reimplantada e validada pelo usuario em `/settings`; acesso anonimo externo continua retornando HTTP 401 por Basic Auth.
- 2026-05-17: aplicada migration `data_sources` no Supabase e gerado pacote v11 com `/data-trust` lendo fontes reais por sessao autenticada.
- 2026-05-17: v11 reimplantada e validada pelo usuario em `/data-trust`.
- 2026-05-17: aplicada migration `proposals` no Supabase e gerado pacote v12 com `/proposals` lendo propostas reais por sessao autenticada.
- 2026-05-17: v12 reimplantada e validada pelo usuario em `/proposals`.
- 2026-05-17: aplicada migration `approvals` no Supabase e gerado pacote v13 com `/approvals` lendo e gravando decisoes supervisionadas.
- 2026-05-17: v13 reimplantada e validada pelo usuario em `/approvals`.
- 2026-05-17: aplicada migration `decision_memory` no Supabase e gerado pacote v14 com `/memory` lendo aprendizados reais por sessao autenticada.
- 2026-05-18: v14 reimplantada e validada pelo usuario em `/memory`.
- 2026-05-18: aplicada migration `raw_metrics` no Supabase e gerado pacote v15 com `/` derivando o dashboard de metricas reais.
- 2026-05-18: v15 reimplantada e validada pelo usuario em `/`.
- 2026-05-18: gerado pacote v16 com Roadmap atualizado para refletir o progresso real ate raw_metrics.
- 2026-05-18: v16 reimplantada e validada pelo usuario em `/roadmap`.
- 2026-05-18: gerado pacote v17 com Roadmap repriorizado para deixar integracoes externas nas fases finais.
- 2026-05-18: gerado pacote v18 com hardening de redirect pos-login restrito a rotas internas.
- 2026-05-18: v18 reimplantada e validada pelo usuario.
- 2026-05-18: gerado pacote v19 com estados padronizados de erro, fallback e vazio nas telas principais.
- 2026-05-18: v19 reimplantada e validada pelo usuario.
- 2026-05-18: gerado pacote v20 com headers defensivos no servidor Node.
- 2026-05-19: v20 reimplantada e validada pelo usuario.
- 2026-05-19: gerado pacote v21 com Roadmap atualizado para fundacao de auditoria.
- 2026-05-19: gerado pacote v22 com Roadmap atualizado apos aplicacao de `audit_events`.
- 2026-05-19: v22 reimplantada e validada pelo usuario em `/roadmap`.
- 2026-05-19: gerado pacote v23 com tela `/audit` lendo `audit_events` pelo Supabase.
- 2026-05-19: v23 reimplantada e validada pelo usuario em `/audit` e `/roadmap`.
- 2026-05-19: gerado pacote v24 com Roadmap atualizado para checklist de backup e recuperacao.
- 2026-05-19: v24 reimplantada e validada pelo usuario em `/roadmap`.
- 2026-05-19: gerado pacote v25 com Roadmap atualizado para Context Intelligence antes do Decision Engine.
- 2026-05-19: v25 reimplantada e validada pelo usuario em `/roadmap`.
- 2026-05-19: gerado pacote v26 com Roadmap atualizado e schema local de Context Intelligence preparado.
- 2026-05-19: aplicada migration `context_intelligence` no Supabase remoto e preparado Roadmap para pacote v27.
- 2026-05-19: v27 reimplantada e aprovada pelo usuario.
- 2026-05-19: preparado pacote v28 com tela `/context` para diagnostico inteligente.
- 2026-05-19: preparado pacote v29 com Roadmap atualizado para Context Research Layer e schema local de pesquisa contextual.
- 2026-05-19: v29 aprovada pelo usuario. Migration `context_research_layer` ainda pendente de autorizacao explicita para aplicacao no Supabase remoto.
- 2026-05-19: aplicada migration `context_research_layer` no Supabase remoto e registrado `https://www.ibob.com.br` como run inicial de pesquisa contextual.
- 2026-05-19: v30 reimplantada e validada pelo usuario.
- 2026-05-19: preparado pacote v31 com console `/research` para pesquisa supervisionada.
- 2026-05-20: v31 reimplantada e validada pelo usuario.
- 2026-05-20: preparada v32 com Roadmap atualizado e carga local de achados supervisionados da pesquisa publica inicial da iBob. A migration de achados ainda depende de autorizacao explicita para aplicar no Supabase remoto.
- 2026-05-20: aplicada migration `20260520100000_seed_ibob_supervised_research_findings.sql` no Supabase remoto.
- 2026-05-20: preparado pacote v33 com Roadmap atualizado para achados supervisionados aplicados e pendentes de revisao humana.
- 2026-05-20: v33 reimplantada e validada pelo usuario em `/research`.
- 2026-05-20: preparado pacote v34 com Roadmap registrando o proximo marco de revisao/promocao dos achados.
- 2026-05-20: v34 reimplantada e validada pelo usuario.
- 2026-05-20: preparado pacote v35 com revisao operacional em `/research` para achados, insights, concorrentes e memoria contextual.
- 2026-05-21: v35 reimplantada/testada pelo usuario.
- 2026-05-21: preparado pacote v36 com filtros de achados, painel de fontes e prontidao da revisao em `/research`.
- 2026-05-21: v36 reimplantada/testada pelo usuario.
- 2026-05-21: preparado pacote v37 com nota de revisao e audit_events nas acoes de pesquisa contextual.
- 2026-05-23: preparado pacote v38 com `/strategy`, revisao CMO, calculos de CAC/CPL e Roadmap atualizado para `CMO Strategy Readiness`.
- 2026-05-23: preparado pacote v39 com breakdown da nota CMO e checklist para chegar a base 100.
- 2026-05-23: preparado pacote v40 com botao `Resolver` e plano de resolucao em `/strategy`.
- 2026-05-24: preparado pacote v41 com `/funnel`, schema local de funil real e template CSV de importacao manual.
- 2026-05-24: aplicada e validada no Supabase remoto a migration `funnel_tracking`.
- 2026-05-24: preparado pacote v42 com Roadmap atualizado apos `funnel_tracking` remoto e diretriz de MCPs supervisionados.
- 2026-05-24: preparado pacote v43 com entrada manual real em `/funnel`, leitura do Supabase e auditoria de eventos de funil.
- 2026-05-24: preparado pacote v44 com avanco paralelo das etapas 5 a 9, estrategia recalibrada por eventos de funil e resumo operacional em `/roadmap`.
- 2026-05-25: preparado pacote v45 com `/decision`, fundacao do Decision Engine supervisionado e Roadmap atualizado para etapas 5 a 10.
- 2026-05-25: preparado pacote v46 com `/validator`, schema local de `rule_validator` e Roadmap atualizado para etapas 5 a 11.
- 2026-05-26: aplicada migration `rule_validator` no Supabase remoto e preparado pacote v47 com `/validator` lendo catalogo ativo de regras.
- 2026-05-26: preparado pacote v48 com hotfix para `/validator`, mesclando catalogo Supabase com fallback local quando regras ainda nao existem no remoto.
- 2026-05-28: preparado pacote v49 com registro de dry-runs do `rule_validator` no Supabase e auditoria.
- 2026-05-28: preparado pacote v50 com historico supervisionado de dry-runs e checks em `/validator`.
- 2026-05-28: preparado pacote v51 com certificacao supervisionada de proposta existente pelo `rule_validator`.
- 2026-05-28: preparado pacote v52 com `/execution` registrando simulacoes em `execution_logs`, sem escrita externa.

Validacao publica:

- `/`
- `/data-trust`
- `/proposals`
- `/approvals`
- `/audit`
- `/context`
- `/research`
- `/strategy`
- `/funnel`
- `/decision`
- `/validator`
- `/execution`
- `/memory`
- `/roadmap`
- `/settings`

Todas as rotas responderam HTTP 200 apos o deploy.
