# Context Research Layer

Data: 2026-05-19

## Objetivo

Adicionar inteligencia de pesquisa ao diagnostico da empresa antes de qualquer analise de Ads.

O diagnostico nao deve depender apenas de respostas manuais. O agente tambem precisa pesquisar o site oficial da empresa, identificar concorrentes, coletar evidencias e propor aprendizados para a memoria contextual.

## Principio

Pesquisa externa nao vira verdade automaticamente.

Todo achado pesquisado precisa manter:

- fonte;
- URL;
- evidencia;
- tipo do achado;
- confianca;
- status de revisao;
- relacao com contexto, concorrente ou memoria.

Somente achados revisados devem ser promovidos para `context_answers` ou `context_memory_items`.

## Schema local preparado

Migration local criada em 2026-05-19:

```text
infra/supabase/migrations/20260519160000_create_context_research_layer.sql
```

Tabelas:

- `context_research_runs`
- `context_research_sources`
- `context_research_findings`
- `competitor_profiles`
- `competitor_insights`
- `context_memory_items`

Enums:

- `context_research_run_status`
- `context_research_source_type`
- `context_research_finding_type`
- `context_research_review_status`
- `competitor_profile_status`
- `context_memory_type`
- `context_memory_status`

## Fluxo previsto

1. Usuario informa o site oficial da empresa.
2. Agente cria um `context_research_run`.
3. Agente pesquisa o site oficial e registra fontes em `context_research_sources`.
4. Agente pesquisa concorrentes e registra `competitor_profiles`.
5. Achados entram em `context_research_findings` ou `competitor_insights`.
6. Achados ficam como `needs_review`.
7. Humano aprova, rejeita ou converte achado.
8. Achado aprovado pode virar:
   - resposta sugerida em `context_answers`;
   - memoria contextual em `context_memory_items`;
   - lacuna em `context_gaps`.

## Como usar no Decision Engine

O Decision Engine so deve usar:

- respostas de contexto revisadas;
- itens ativos em `context_memory_items`;
- concorrentes ativos em `competitor_profiles`;
- insights aceitos ou convertidos.

Achados `needs_review` podem ser citados como pendencia, mas nao devem sustentar recomendacao de budget, pausa, publico ou criativo.

## Estado atual

- Schema aplicado no Supabase remoto em 2026-05-19.
- Tipos TypeScript atualizados.
- Roadmap atualizado.
- Site oficial da iBob registrado: `https://www.ibob.com.br`.
- Run inicial de pesquisa contextual criado como `queued`.
- Lacuna `ibob.company_site_required` resolvida.
- Lacuna `ibob.context_research_execution_pending` aberta para executar a pesquisa supervisionada.
- Primeira console criada em `/research`.
- `/research` le runs, fontes, achados, concorrentes, insights e memoria contextual pelo Supabase.
- `/research` permite criar novos runs supervisionados sem executar busca externa automaticamente.
- Pesquisa publica inicial da iBob preparada e aplicada no Supabase remoto em 2026-05-20.
- Migration criada para registrar fontes, achados, concorrentes candidatos, insights e memoria em rascunho:

```text
infra/supabase/migrations/20260520100000_seed_ibob_supervised_research_findings.sql
```

- Historico remoto validado com `supabase migration list`.
- Todos os achados ficam como `needs_review`.
- Todos os concorrentes entram como `candidate`.
- Todos os itens de memoria entram como `draft`.
- Nada e promovido automaticamente para contexto ativo ou memoria ativa.
- V33 validada pelo usuario em `/research` em 2026-05-20.
- V34 validada pelo usuario em `/roadmap` em 2026-05-20.
- V35 prepara revisao operacional em `/research`.
- `/research` passa a permitir aceitar/rejeitar achados e insights, ativar/descartar concorrentes e ativar/arquivar memoria contextual.
- As acoes de revisao exigem dados reais do Supabase e respeitam RLS por `client_id`.
- V35 reimplantada/testada pelo usuario.
- V36 adiciona filtros de achados, painel de fontes publicas e indicador de prontidao da revisao.
- V36 reimplantada/testada pelo usuario.
- V37 adiciona nota opcional de revisao e registro automatico em `audit_events` para acoes de pesquisa contextual.
- Ainda falta criar tela dedicada de historico/justificativa de revisao e conversao para `context_answers`.

## Fontes publicas usadas na pesquisa inicial

- Site oficial iBob: `https://ibob.com.br/`
- Loja oficial iBob: `https://loja.ibob.com.br/`
- Contato iBob: `https://loja.ibob.com.br/contato`
- Lotus Automacao: `https://lotusautomacao.com.br/`
- Hercules Motores: `https://loja.herculesmotores.com.br/motorredutores.html`
- Varivelox: `https://www.varivelox.com.br/`
- Vale Automacao: `https://www.lojavale.com.br/`
- Dimensional / WEG: `https://materiais.dimensional.com.br/parceriaweg`

## Achados preparados para revisao

- A iBob parece combinar ecommerce de produtos industriais com venda tecnica consultiva.
- A comunicacao e as futuras campanhas precisam separar compra direta de produto especifico e demanda de especificacao tecnica.
- Canais proprios, loja oficial, WhatsApp e marketplaces devem ser analisados separadamente por margem, controle e previsibilidade.
- Concorrentes candidatos incluem distribuidores/ecommerces, fabricantes e distribuidores autorizados WEG.
- A pesquisa cria uma nova lacuna: `ibob.research_findings_review_pending`.

## Proxima acao

Validar a v37 em `/research` e `/audit`, conferindo se a nota de revisao aparece no historico operacional apos uma acao controlada.
