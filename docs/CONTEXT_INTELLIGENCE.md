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

## Estrutura futura sugerida

Tabelas candidatas:

- `business_contexts`
- `context_questions`
- `context_answers`
- `context_versions`
- `context_gaps`

Campos conceituais:

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
- Ainda falta criar schema, perguntas iniciais e tela de diagnostico.
- Ainda falta migrar o contexto comercial ja levantado da iBob para estrutura versionada.
