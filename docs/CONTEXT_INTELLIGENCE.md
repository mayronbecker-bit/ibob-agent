# Context Intelligence

Data: 2026-05-19

## Objetivo

Criar o cerebro de contexto da empresa antes de qualquer analise de Ads, proposta de midia ou recomendacao automatizada.

O objetivo final do produto e vender mais com menor custo de ads e mais previsibilidade. Para isso, o agente precisa entender o negocio, nao apenas campanhas.

## Principio

Nenhuma recomendacao deve ser gerada apenas porque uma metrica de Ads parece boa ou ruim.

Antes de sugerir aumentar verba, pausar campanha, trocar publico ou alterar criativo, o sistema precisa saber:

- o que a empresa vende;
- para quem vende melhor;
- quais clientes nao valem a pena;
- qual margem permite escalar;
- qual capacidade operacional existe;
- quais metas importam;
- quais restricoes comerciais bloqueiam crescimento;
- quais sinais indicam qualidade real do lead ou venda.

## Etapa no produto

Context Intelligence deve entrar antes de:

- Decision Engine;
- rule_validator;
- Execution Engine;
- integracoes externas de Ads.

Context Research Layer entra dentro desta fase, depois do diagnostico manual inicial e antes do Decision Engine. Ele pesquisa site da empresa e concorrentes, mas mantem os achados como evidencias revisaveis antes de virarem memoria ou resposta ativa.

## Diagnostico inteligente

A entrada de contexto deve ser feita por perguntas e respostas intencionais, nao por um campo livre solto.

Categorias iniciais:

- Oferta principal.
- Ticket medio.
- Margem por produto ou servico.
- Capacidade de atendimento/entrega.
- Publico ideal.
- Publico que deve ser evitado.
- Regioes atendidas.
- Sazonalidade.
- Objeções comerciais.
- Processo comercial.
- Tempo medio ate venda.
- Meta de CAC/CPA/ROAS.
- Verba disponivel.
- Produtos prioritarios.
- Diferenciais competitivos.
- Restricoes legais, operacionais ou comerciais.
- Indicadores de lead bom.
- Indicadores de lead ruim.
- Nivel de previsibilidade esperado.

## Schema local preparado

Migration local criada em 2026-05-19:

```text
infra/supabase/migrations/20260519133000_create_context_intelligence.sql
```

Tabelas:

- `business_contexts`
- `context_questions`
- `context_answers`
- `context_versions`
- `context_gaps`

Enums:

- `context_status`: `draft`, `active`, `archived`
- `context_question_category`: oferta, economia, publico, geografia, sazonalidade, processo comercial, capacidade, metas, restricoes, diferenciacao, qualidade de lead, previsibilidade e operacao.
- `context_answer_type`: texto, numero, booleano, escolha unica, multipla escolha, moeda, percentual e json.
- `context_answer_source`: usuario, importacao, inferencia do agente e revisao manual.
- `context_gap_status`: aberto, resolvido ou ignorado.
- `context_gap_severity`: info, warning ou critical.

Campos principais:

- `client_id`
- `version`
- `question_key`
- `question`
- `answer`
- `category`
- `confidence`
- `source`
- `reviewed_by`
- `reviewed_at`
- `is_active`

Garantias:

- isolamento por `client_id`;
- RLS habilitado em todas as tabelas;
- leitura por membros do cliente;
- escrita por `owner` e `admin`;
- banco global de perguntas ativo para usuarios autenticados;
- `context_answers`, `context_versions` e `context_gaps` vinculados ao mesmo `context_id` e `client_id`.

Seed inicial:

- 19 perguntas intencionais de diagnostico.
- contexto draft `Contexto comercial iBob` para `client-ibob`.
- versao draft 1.
- lacuna aberta para migrar o contexto comercial ja levantado da iBob.

## Como o contexto deve ser usado

Decision Engine:

- consulta o contexto antes de gerar sugestoes;
- explica quais pontos do contexto influenciaram a recomendacao;
- sinaliza quando nao ha contexto suficiente.

rule_validator:

- bloqueia sugestoes que violam margem, capacidade, restricao comercial ou perfil de cliente;
- exige contexto minimo antes de aprovar proposta.

Data Trust:

- deve incluir status de completude do contexto;
- contexto incompleto pode deixar o agente em amarelo, nao necessariamente vermelho.

Audit:

- deve registrar criacao, revisao e mudanca de contexto.

## Exemplo

Se Ads mostra lead barato, mas o contexto diz que esse perfil nao compra, gera suporte excessivo ou tem margem baixa, o agente nao deve recomendar aumento de verba.

Se uma campanha tem CPA alto, mas vende o produto de maior margem e maior recorrencia, o agente nao deve recomendar pausa sem avaliar o contexto comercial.

## Estado atual

- Etapa adicionada ao Roadmap.
- Conceito documentado.
- Schema criado e aplicado no Supabase remoto em 2026-05-19.
- Perguntas iniciais versionadas na migration.
- Tipos TypeScript atualizados no app.
- Roadmap atualizado para marcar Context Intelligence em andamento.
- Migration remota validada pelo historico do Supabase CLI.
- Primeira tela de diagnostico criada em `/context`.
- `/context` le `business_contexts`, `context_questions`, `context_answers` e `context_gaps` pelo Supabase.
- `/context` permite salvar respostas em `context_answers` e recalcular completude do contexto.
- Context Research Layer desenhado em `docs/CONTEXT_RESEARCH.md`.
- Migration de pesquisa contextual aplicada no Supabase para site da empresa, concorrentes, achados, evidencias e memoria contextual.
- Site oficial `https://www.ibob.com.br` registrado para o primeiro run supervisionado.
- Console `/research` criada para acompanhar pesquisa contextual e criar novos runs supervisionados.
- Ainda falta migrar o contexto comercial ja levantado da iBob para estrutura versionada.
- Ainda falta executar a pesquisa supervisionada e revisar achados antes de promover para memoria.
