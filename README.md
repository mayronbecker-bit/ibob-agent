# iBob - Agent

Projeto em preparacao local para desenvolvimento assistido no VS Code, com organizacao de app, configuracao, validacao e deploy supervisionado.

## Estado atual

- Estrutura base criada em 2026-05-11.
- Git sera usado para historico local do projeto.
- Stack escolhida: Next.js em `apps/web`.
- Cloud escolhida: Hostinger.
- Diretriz de produto: iBob como piloto/MVP, com evolucao planejada para produto vendavel e escalavel.
- Blueprint da Claude importado como referencia funcional do agente de trafego pago.
- MVP local navegavel implementado em Next.js com dados mockados e fluxo seguro.
- Fundacao de dados local implementada com contratos de dominio e configuracao da iBob preparada para multi-cliente.
- Controle de acesso temporario por usuario/senha via variaveis de ambiente.
- Nenhum segredo deve ser salvo no repositorio.

## Estrutura

```text
.
  apps/
    web/
    api/
  packages/
    shared/
  infra/
    docker/
    cloud/
  scripts/
  tests/
  docs/
```

## Fluxo de trabalho

1. Trabalhar no app Next.js em `apps/web`.
2. Configurar variaveis em `.env` local, mantendo apenas `.env.example` versionado.
3. Rodar validacoes locais.
4. Preparar ambiente Hostinger.
5. Fazer deploy somente com autorizacao explicita do usuario.
6. Registrar mudancas em `docs/CHANGELOG.md` e decisoes em `docs/DECISIONS.md`.

## Comandos principais

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

Os comandos do root encaminham para `apps/web`.

## Documentos

- [Setup](docs/SETUP.md)
- [Deploy](docs/DEPLOY.md)
- [Hostinger](docs/HOSTINGER.md)
- [Checklist do primeiro deploy](docs/FIRST_DEPLOY_CHECKLIST.md)
- [MVP local](docs/LOCAL_MVP.md)
- [Fundacao de dados](docs/DATA_FOUNDATION.md)
- [Autenticacao e banco de dados](docs/AUTH_AND_DATABASE.md)
- [Controle de acesso](docs/ACCESS_CONTROL.md)
- [Conversa com o agente](docs/AGENT_CONVERSATION.md)
- [Integracao do blueprint da Claude](docs/CLAUDE_BLUEPRINT_INTEGRATION.md)
- [Estrategia de produto](docs/PRODUCT_STRATEGY.md)
- [Decisoes](docs/DECISIONS.md)
- [Changelog](docs/CHANGELOG.md)

## Blueprint importado

O material original da Claude esta versionado em:

```text
docs/claude-blueprint/ibob_agente_projeto/
```

Esses arquivos sao referencia de planejamento e nao devem ser publicados no app sem confirmacao, pois o pacote original esta marcado como confidencial.
