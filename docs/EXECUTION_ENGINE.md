# Execution Engine

Data: 2026-05-28
Versao: v52

## Objetivo

Separar decisao de execucao. O Decision Engine formula hipoteses, o `rule_validator` certifica, a aprovacao humana decide e o Execution Engine registra uma simulacao antes de qualquer escrita externa.

## Entrega v52

Foi criada a rota:

```text
/execution
```

Ela le dados reais do Supabase quando ha sessao valida e mostra:

- propostas aprovadas;
- propostas com `rule_validator_passed = true`;
- aprovacao humana correspondente;
- historico de `execution_logs`;
- botao `Simular execucao`.

## O que o botao faz

`Simular execucao` grava:

- uma linha em `execution_logs`;
- `result = simulated`;
- `is_dry_run = true`;
- `state_before` com contexto da proposta/aprovacao;
- `state_after` confirmando que nao houve escrita externa;
- evento `execution.dry_run_recorded` em `audit_events`.

## O que o botao nao faz

A v52 nao:

- chama Google Ads;
- chama Meta Ads;
- chama MCP;
- altera campanhas reais;
- altera status da proposta para `executed`;
- cria rollback real.

## Pre-condicoes

Uma proposta so entra na fila de simulacao quando:

- esta aprovada em `/approvals`;
- passou pelo `rule_validator`;
- existe aprovacao humana registrada.

## Proxima etapa

Validar `/execution` em producao, executar uma simulacao, conferir `execution_logs` na tela e confirmar o evento `execution.dry_run_recorded` em `/audit`.
