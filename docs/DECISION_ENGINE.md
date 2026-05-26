# Decision Engine supervisionado

Data: 2026-05-25
Versao: v45

## Objetivo

Criar a primeira fundacao do Decision Engine sem executar anuncios, sem chamar MCPs e sem depender de IA externa.

Esta versao funciona como um pre-motor de governanca. Ela responde:

- o contexto comercial esta ativo?
- a pesquisa e memoria foram revisadas?
- o funil/CRM ja tem evidencias suficientes?
- o Data Trust permite confiar nos numeros?
- o agente pode gerar proposta supervisionada?
- o agente continua bloqueado para execucao externa?

## Rota criada

```text
/decision
```

## Entradas usadas

A tela usa dados existentes:

- `business_contexts`
- `context_questions`
- `context_answers`
- `context_gaps`
- `context_research_findings`
- `competitor_profiles`
- `competitor_insights`
- `context_memory_items`
- `funnel_events`
- `data_sources`

Nao foi criada migration nova na v45.

## Gates avaliados

### Contexto comercial ativo

Exige contexto ativo e bom nivel de completude. Se o contexto estiver em draft, o motor fica bloqueado ou em alerta.

### Lacunas criticas resolvidas

Lacunas criticas abertas bloqueiam recomendacoes. Lacunas nao criticas viram alerta.

### Pesquisa e memoria revisadas

O motor considera somente achados revisados, memoria ativa e concorrentes ativos.

### Funil real minimo

O motor procura cadeia minima:

- lead qualificado;
- oportunidade;
- proposta enviada;
- venda ganha;
- venda com margem.

Sem isso, o agente nao deve otimizar por Ads porque pode confundir lead barato com crescimento real.

### Prontidao CMO validada

Usa a nota de `/strategy` como gate de consolidacao. Se a estrategia estiver abaixo do minimo, o motor nao deve gerar proposta.

### Data Trust

Fonte vermelha bloqueia. Fonte amarela gera alerta.

### Execucao externa bloqueada

Mesmo com todos os gates liberados, a v45 permanece em `SUPERVISED_DRY_RUN`.

## Hipoteses deterministicas

A v45 mostra hipoteses que podem virar propostas revisaveis depois:

- separar compra direta de venda consultiva;
- otimizar por margem, nao por volume de lead;
- transformar no-fit em regra de exclusao;
- usar diferencial tecnico como promessa central;
- separar canais proprietarios de marketplaces quando houver evidencia.

Essas hipoteses ainda nao viram proposta no banco e nao executam nenhuma acao.

## Diretriz MCP

Google Ads MCP e Meta Ads MCP continuam planejados para as fases finais.

O agente iBob segue como cerebro:

- entende contexto;
- confere funil/CRM;
- valida numeros;
- aplica gates;
- exige aprovacao humana;
- registra auditoria;
- so depois, em etapa futura, podera dar ordens supervisionadas a conectores.

## Proxima etapa

V46 criou `/validator` e a migration local do `rule_validator` para transformar gates em regras versionadas antes de gerar propostas reais no Supabase.
