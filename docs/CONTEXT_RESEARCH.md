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

- Schema local preparado.
- Tipos TypeScript atualizados.
- Roadmap atualizado.
- Ainda nao aplicado no Supabase remoto.
- Ainda falta informar o site oficial da iBob.
- Ainda falta criar executor/agente de pesquisa.
- Ainda falta tela para revisar achados e promover para memoria.
