# Avanco Paralelo - Etapas 5 a 11

Data: 2026-05-24

## Objetivo

Avancar as etapas 5 a 11 juntas sem conectar integracoes externas ainda.

O foco e criar um ciclo fechado:

```text
Contexto -> Pesquisa -> Estrategia -> Funil Real -> Estrategia recalibrada -> Decision Engine supervisionado -> Rule Validator
```

## Etapas envolvidas

### 5. Hardening do produto piloto

Continua como camada transversal:

- deploy supervisionado;
- auditoria de acoes sensiveis;
- RLS por `client_id`;
- fallback controlado para mock quando o Supabase falha;
- nenhum deploy ou integracao externa sem validacao.

### 6. Context Intelligence

O contexto comercial da iBob segue como fonte primaria para:

- oferta prioritaria;
- ICP;
- publico ruim;
- margem;
- CAC;
- budget;
- capacidade;
- janela de venda.

### 7. Context Research Layer

Pesquisa, concorrentes e memoria contextual revisada continuam alimentando a estrategia.

Nada de pesquisa bruta vira decisao sem revisao humana.

### 8. CMO Strategy Readiness

Na v44, `/strategy` passa a considerar eventos reais do funil:

- eventos registrados;
- origens mapeadas;
- etapas cobertas;
- vendas com margem;
- leads qualificados;
- oportunidades;
- propostas;
- vendas ganhas.

A nota de tracking deixa de ser fixa e passa a depender dos eventos reais registrados em `/funnel`.

### 9. Tracking e Funil Real

Na v44, `/funnel` ganha resumo operacional:

- eventos registrados;
- etapas cobertas;
- leads qualificados;
- vendas ganhas;
- receita registrada;
- margem bruta registrada.

Esses dados sao usados para calibrar `/strategy`.

### 10. Decision Engine supervisionado

Na v45, `/decision` cria um pre-motor deterministico:

- le contexto ativo;
- le pesquisa, concorrentes e memorias revisadas;
- le eventos reais de funil;
- le Data Trust;
- mostra gates, bloqueios, evidencias e hipoteses;
- permanece em `SUPERVISED_DRY_RUN`.

Ele nao chama IA externa, nao chama MCP e nao executa Ads.

### 11. Rule Validator

Na v46, `/validator` transforma gates em regras deterministicas:

- contexto ativo;
- lacunas criticas;
- pesquisa e memoria revisadas;
- funil real minimo;
- nota CMO;
- Data Trust;
- risco da proposta;
- aumento de budget com margem;
- execucao externa bloqueada;
- MCPs sem escrita.

A migration local `20260525100000_create_rule_validator.sql` fica preparada, mas nao aplicada remotamente sem autorizacao.

## Diretriz MCP

Google Ads MCP e Meta Ads MCP continuam planejados como conectores supervisionados.

Eles nao substituem o agente iBob. O agente:

- interpreta contexto;
- cruza Ads com CRM/funil;
- valida numeros;
- aplica regras deterministicas;
- pede aprovacao humana;
- registra auditoria;
- so entao envia ordem supervisionada a um MCP.

## Proxima acao

Validar v46 em `/roadmap`, `/strategy`, `/funnel`, `/decision` e `/validator`.

Depois autorizar, se aprovado, a aplicacao remota do schema `rule_validator`.
