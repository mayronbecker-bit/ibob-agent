# Fundação de dados — iBob Agent

Data: 2026-05-16

## Objetivo

Estabelecer contratos de domínio tipados que representem todas as entidades do sistema antes de qualquer integração real. Esses contratos servem como a fonte única de verdade para o front-end local e como o blueprint direto do schema Supabase futuro.

## O que foi implementado

### 1. Contratos de domínio (`apps/web/src/lib/domain/types.ts`)

Arquivo canônico com todos os tipos TypeScript do sistema. Cada interface mapeia 1-para-1 com uma tabela Supabase futura.

| Tipo | Tabela Supabase futura | Descrição |
|---|---|---|
| `Client` | `clients` | Cliente/tenant da plataforma |
| `User` | `users` | Usuário vinculado a um cliente |
| `DataSource` | `data_sources` | Fonte de dados (Google Ads, Meta, GA4, etc.) |
| `DataTrustState` | view derivada | Estado agregado das fontes de dados |
| `RawMetric` | `raw_metrics` | Métrica bruta coletada de uma fonte |
| `AgentState` | view/cache | Estado atual do agente por cliente |
| `AgentVersion` | `agent_versions` | Versão do agente com prompt e thresholds |
| `Proposal` | `proposals` | Sugestão gerada pelo agente |
| `Approval` | `approvals` | Decisão humana sobre uma proposta |
| `DecisionMemory` | `decision_memory` | Aprendizado registrado após decisão |
| `ExecutionLog` | `execution_logs` | Log de execução (real ou simulada) |
| `RoadmapStage` | — | Estágio do roadmap (apenas UI) |
| `OverviewMetric` | — | Métrica de dashboard (apenas UI) |

### 2. Campos de rastreabilidade adicionados

Todos os tipos de domínio com persistência incluem:

- `clientId: string` — permite isolamento multi-tenant no Supabase via Row Level Security (RLS).
- `agentVersion: string` + `promptVersion: string` em `Proposal` — permite auditar qual versão do agente gerou cada proposta.

### 3. Aliases de backward compatibility

Para não quebrar as telas existentes durante a migração:

- `ApprovalRecord` → alias de `Approval`
- `DecisionMemoryEntry` → alias de `DecisionMemory`

### 4. Camada de configuração do cliente (`apps/web/src/config/`)

```
src/config/
├── client.ts          # Interface ClientConfig
├── clients/
│   └── ibob.ts        # Configuração específica da iBob
└── index.ts           # Exporta activeClient (hoje sempre iBob)
```

A configuração da iBob define:

```typescript
{
  id: 'client-ibob',
  name: 'iBob',
  slug: 'ibob',
  mode: 'DRY_RUN',         // nunca SUPERVISED ou AUTONOMOUS sem decisão explícita
  approvers: ['Mayron', 'Cassiano'],
  channels: ['google_ads', 'meta_ads'],
  agentVersion: '0.1.0',
  promptVersion: 'v1.0',
  thresholdVersion: 'v1.0',
}
```

**Extensão para multi-cliente:** bastará criar `src/config/clients/outro-cliente.ts` com o mesmo contrato `ClientConfig` e apontar `activeClient` para ele (ou resolver pelo slug via variável de ambiente).

### 5. Mock data refatorado (`apps/web/src/lib/mock-data.ts`)

O arquivo de mock agora:
- Importa de `@/lib/domain/types` (não de `@/types`)
- Exporta `mockClient`, `mockUsers`, `mockAgentVersion`, `mockAgentState` — entidades novas
- Adiciona `clientId: 'client-ibob'` em todos os objetos
- Adiciona `agentVersion` e `promptVersion` em cada `Proposal`
- Adiciona `id` em cada `Approval` (antes inexistente)
- Mantém todos os exports anteriores compatíveis (`proposals`, `approvalHistory`, `decisionMemory`, `roadmapStages`, `overviewMetrics`, `dataTrustState`)

### 6. Página de Configurações (`/settings`)

Rota nova em `apps/web/src/app/settings/page.tsx`. Exibe:
- Nome do cliente piloto e modo ativo (DRY_RUN)
- Versão do agente, prompt e thresholds
- Canais ativos
- Aprovadores autorizados com roles
- Fontes de dados configuradas
- Próximos passos para migração real

## Como isso prepara o Supabase

### Schema direto dos contratos

Cada interface de domínio vira uma tabela com as colunas correspondentes. Exemplo para `proposals`:

```sql
create table proposals (
  id              text primary key,
  client_id       text references clients(id),
  title           text not null,
  channel         text not null,        -- 'google_ads' | 'meta_ads'
  type            text not null,
  reasoning       text not null,
  expected_impact text not null,
  status          text not null,        -- 'pending' | 'approved' | ...
  risk_level      text not null,
  rule_validator_passed boolean not null,
  rule_validator_notes  text,
  created_at      timestamptz not null,
  budget_delta_brl numeric,
  agent_version   text not null,
  prompt_version  text not null
);

-- Row Level Security: cada cliente vê apenas seus dados
alter table proposals enable row level security;
create policy "client isolation" on proposals
  using (client_id = current_setting('app.client_id'));
```

### Migração de mock para Supabase

1. Criar tabelas no Supabase com o schema acima.
2. Substituir os exports de `mock-data.ts` por chamadas a `supabase.from('proposals').select(...)`.
3. `activeClient` pode ser resolvido pelo JWT do usuário autenticado em vez de ser hardcoded.
4. O código das páginas **não precisa mudar** — consome os mesmos tipos e os mesmos nomes de variáveis.

### Row Level Security e multi-tenant

O campo `clientId` em todos os tipos de domínio existe especificamente para habilitar RLS no Supabase. Cada query filtra automaticamente pelo `client_id` do usuário autenticado, garantindo isolamento sem lógica extra no front-end.

## Estado atual vs. planejado

Atualizacao em 2026-05-16: a fundacao Supabase foi preparada com dependencias, helpers SSR e schema SQL versionado em `infra/supabase/migrations/20260516170000_initial_platform_auth.sql`. A migration ainda nao foi aplicada em ambiente real.

| Camada | Estado atual | Quando migrar |
|---|---|---|
| Tipos | ✅ Contratos completos | — |
| Config do cliente | ✅ Separada e extensível | — |
| Mock data | ✅ Conforme contratos | Etapa 2 (Supabase) |
| Supabase Auth | ❌ Não implementado | Etapa 2 |
| Tabelas reais | ❌ Não implementado | Etapa 2 |
| Integrações (Google Ads, Meta) | ❌ Simuladas | Etapa 3 |
| Execution Engine | ❌ Não implementado | Etapa 8 |

## Regras de manutenção

- Toda mudança de schema começa em `src/lib/domain/types.ts`.
- Nunca alterar tipos de domínio sem atualizar também o mock data e este documento.
- Novos campos em tipos persistentes devem ter `clientId` se pertencerem a um tenant.
- Não adicionar lógica de negócio em `src/lib/domain/types.ts` — apenas tipos.
