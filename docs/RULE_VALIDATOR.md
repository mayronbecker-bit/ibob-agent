# Rule Validator

Data: 2026-05-25
Versao: v51

## Objetivo

Transformar os gates do Decision Engine em regras deterministicas, versionadas e auditaveis antes de qualquer proposta real, aprovacao humana ou execucao externa.

## Entrega v46

Foi criada a rota:

```text
/validator
```

Ela executa um dry-run local usando:

- prontidao do Decision Engine;
- contexto comercial;
- pesquisa e memoria revisadas;
- funil real;
- Data Trust;
- primeira proposta pendente como amostra, quando existir.

## Entrega v47

A migration `20260525100000_create_rule_validator.sql` foi aplicada no Supabase remoto em 2026-05-26.

Validacoes remotas:

- migration local/remota alinhada;
- tabelas `rule_validator_rules`, `rule_validator_runs` e `rule_validator_checks` presentes;
- enums `rule_validator_rule_category`, `rule_validator_rule_severity`, `rule_validator_rule_status` e `rule_validator_result` presentes;
- policies RLS de leitura e insercao/gestao presentes;
- 8 regras v1 ativas para `client-ibob`.

A rota `/validator` passa a ler o catalogo ativo de regras do Supabase quando a sessao esta disponivel. Se a leitura falhar, continua usando o catalogo local como fallback visual.

## Hotfix v48

O catalogo remoto aplicado na v47 tem 8 regras ativas, enquanto o dry-run local ja validava 10 regras. Em sessoes autenticadas, isso podia derrubar `/validator` ao tentar avaliar uma regra ainda ausente no remoto.

A v48 corrige isso mesclando:

- regras ativas do Supabase;
- regras locais de fallback por `ruleKey`.

Assim o Supabase continua sendo fonte preferencial, mas a tela nao quebra enquanto o catalogo remoto evolui.

## Entrega v49

A rota `/validator` passa a registrar dry-runs reais no Supabase quando o usuario clica em `Registrar dry-run`.

O registro grava:

- uma linha em `rule_validator_runs`;
- uma linha por regra em `rule_validator_checks`;
- um evento `rule_validator.run_recorded` em `audit_events`.

O botao fica disponivel apenas quando a tela carrega dados reais do Supabase. Em modo fallback/mock, ele permanece bloqueado.

Essa acao nao:

- cria proposta nova;
- solicita aprovacao humana;
- chama Google Ads MCP ou Meta Ads MCP;
- executa qualquer acao externa.

## Entrega v50

A rota `/validator` passa a exibir o historico supervisionado dos ultimos dry-runs salvos no Supabase.

A tela mostra:

- data/hora do run;
- resultado geral;
- contagem de regras que passaram, alertas e falhas;
- se o run pode ser promovido para proposta supervisionada;
- confirmacao de que Ads/MCPs continuam bloqueados;
- principais checks que exigem conferencia humana.

Essa entrega prepara a ponte entre `Decision Engine -> rule_validator -> proposta`, mas ainda nao cria proposta nova automaticamente.

## Entrega v51

A rota `/validator` passa a permitir a certificacao de uma proposta existente quando o dry-run esta aprovado para promocao supervisionada.

A acao `Certificar proposta`:

- registra um novo dry-run auditavel;
- atualiza a proposta em `proposals.rule_validator_passed`;
- grava notas em `proposals.rule_validator_notes`;
- cria o evento `rule_validator.proposal_certified` em `audit_events`;
- mantem aprovacao humana obrigatoria em `/approvals`;
- mantem `can_execute_external_action = false`.

Essa acao nao cria proposta nova e nao executa nenhuma acao em Google Ads, Meta Ads ou MCP.

## Migration aplicada

```text
infra/supabase/migrations/20260525100000_create_rule_validator.sql
```

Ela criou:

- `rule_validator_rules`;
- `rule_validator_runs`;
- `rule_validator_checks`;
- enums de categoria, severidade, status e resultado;
- RLS por `client_id`;
- catalogo inicial de regras v1 para a iBob.

## Regras v1

- `context.active_minimum`
- `context.no_critical_gaps`
- `research.memory_reviewed`
- `funnel.minimum_truth`
- `strategy.cmo_minimum_score`
- `data_trust.no_red_sources`
- `proposal.no_high_risk_without_review`
- `proposal.budget_increase_requires_margin`
- `execution.external_action_locked`
- `execution.mcp_read_only_until_final_stage`

## Principio operacional

O Decision Engine pensa e formula hipoteses. O `rule_validator` decide se a hipotese pode virar proposta supervisionada.

Se uma regra bloqueante falhar:

- a proposta nao deve ser criada;
- nenhuma aprovacao humana deve ser solicitada;
- nenhuma execucao externa deve ser tentada.

Se apenas alertas aparecerem:

- a proposta pode seguir para revisao humana;
- os alertas precisam acompanhar a justificativa;
- execucao externa continua bloqueada.

## MCPs e Ads

Google Ads MCP e Meta Ads MCP seguem fora desta etapa.

Na arquitetura final, eles serao conectores. O `rule_validator` deve continuar sendo a trava deterministica antes de qualquer ordem para MCP.

## Proxima etapa

Validar `/validator` em producao, certificar uma proposta aprovada pelo dry-run e conferir se `/proposals` e `/approvals` mostram `rule_validator: passou`.
