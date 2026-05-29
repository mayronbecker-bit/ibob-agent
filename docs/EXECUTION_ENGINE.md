# Execution Engine

Data: 2026-05-28
Versao: v53

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

## Entrega v53

A rota `/execution` passa a fechar o dry-run com governanca operacional:

- checklist de preflight por proposta;
- bloqueio visual quando uma pre-condicao falha;
- alerta quando ja existe simulacao anterior;
- plano de rollback antes de qualquer execucao real futura;
- preflight e rollback gravados em `execution_logs.state_before` e `execution_logs.state_after`;
- metadata de auditoria com status de preflight e quantidade de passos de rollback.

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

Validar `/execution` em producao, conferir o preflight, executar uma simulacao e confirmar o evento `execution.dry_run_recorded` em `/audit`.
