# MVP local

Data: 2026-05-12

## Objetivo

Rodar localmente uma primeira versao navegavel do produto antes de qualquer deploy.

Esta versao transforma o blueprint da Claude em uma interface Next.js funcional, mas ainda sem APIs externas reais e sem secrets.

## Status

Implementado em `apps/web`.

Rotas criadas:

- `/`: visao geral.
- `/data-trust`: Data Trust Layer.
- `/proposals`: propostas do agente.
- `/approvals`: fila de aprovacao humana.
- `/memory`: memoria de decisao.
- `/roadmap`: plano de evolucao.
- `/settings`: configuracao ativa do cliente piloto e modo do agente.

## O que funciona localmente

- Dashboard com metricas mockadas.
- Estado do agente: verde, amarelo ou vermelho.
- Lista de fontes de dados simuladas.
- Propostas com canal, risco, impacto, status e resultado do `rule_validator`.
- Fila de aprovacao humana com decisoes locais em memoria da sessao.
- Historico de aprovacoes.
- Memoria de decisao com aprendizados.
- Roadmap do piloto iBob ate produto escalavel.
- Configuracao do cliente iBob separada do core do produto.
- Contratos de dominio preparados para futura migracao para Supabase.
- Layout responsivo para desktop e telas menores.

## O que ainda e simulado

- Google Ads API.
- Meta Marketing API.
- GA4/Pixel.
- Orbita.
- CRM.
- Supabase.
- Claude API.
- Execution Engine.
- Rollback real.

## Fundacao de dados

Os tipos canonicos ficam em:

```text
apps/web/src/lib/domain/types.ts
```

A configuracao especifica da iBob fica em:

```text
apps/web/src/config/clients/ibob.ts
```

Detalhes: `docs/DATA_FOUNDATION.md`.

## Regra operacional

O MVP local roda em modo seguro:

- Sem tokens reais.
- Sem escrita em plataformas externas.
- Sem deploy automatico.
- Sem execucao real de mudancas em campanhas.

Fluxo preservado:

1. Modelo sugere.
2. `rule_validator` valida.
3. Proposta entra na fila.
4. Humano aprova, rejeita ou adia.
5. Executor so sera habilitado em fase posterior.
6. Log e memoria registram o resultado.

## Como rodar

No root do projeto:

```powershell
npm.cmd run dev
```

Depois abrir:

```text
http://localhost:3000
```

Rotas principais:

```text
http://localhost:3000/
http://localhost:3000/data-trust
http://localhost:3000/proposals
http://localhost:3000/approvals
http://localhost:3000/memory
http://localhost:3000/roadmap
http://localhost:3000/settings
```

## Validacoes

Antes de qualquer deploy:

```powershell
npm.cmd run lint
npm.cmd run build
```
