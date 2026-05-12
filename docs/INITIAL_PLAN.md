# Plano inicial

Data: 2026-05-11

## O que ja existe

- Workspace local em `C:\OneDrive\Documentos\iBob - Agent`.
- Repositorio Git inicializado na branch `main`.
- Estrutura base de pastas.
- Documentacao inicial.
- `.gitignore` com exclusoes comuns.
- `.env.example` sem segredos.
- App Next.js em `apps/web`.
- Scripts no root delegando para `apps/web`.
- Diretriz registrada: iBob como piloto/MVP, com evolucao para produto vendavel e escalavel.
- Blueprint da Claude importado como referencia funcional e arquitetural do agente.

## O que falta configurar

- Backend separado ou rotas server-side dentro do Next.js, se necessario.
- Banco de dados.
- Configuracao real na Hostinger.
- Adaptacao da arquitetura Claude para Hostinger, Supabase e possiveis workers separados.
- CI/CD, caso o usuario queira automatizar validacoes e deploy.
- Ambientes: local, staging e producao.

## Estrutura de pastas

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

## Arquivos criados

- `README.md`
- `.gitignore`
- `.env.example`
- `docs/SETUP.md`
- `docs/DEPLOY.md`
- `docs/DECISIONS.md`
- `docs/CHANGELOG.md`
- `docs/INITIAL_PLAN.md`
- `apps/README.md`
- `packages/README.md`
- `infra/README.md`
- `scripts/README.md`
- `tests/README.md`
- Placeholders `.gitkeep` em pastas ainda vazias.

## Arquivos provaveis a criar depois

Dependem da stack escolhida.

- `package.json`, se o projeto usar Node.js.
- `pnpm-workspace.yaml`, se o projeto usar monorepo Node com pnpm.
- `pyproject.toml` ou `requirements.txt`, se o projeto usar Python.
- `Dockerfile` e `docker-compose.yml`, se usar containers.
- Arquivos de CI, como `.github/workflows/*.yml`, se usar GitHub Actions.
- Arquivos especificos do provedor cloud em `infra/cloud/`.

## Dependencias

Dependencias instaladas em `apps/web`:

- Next.js
- React
- React DOM
- TypeScript
- Tailwind CSS
- ESLint
- Tipos de Node/React

## Fluxo de deploy

1. Confirmar plano Hostinger e ambiente alvo.
2. Criar ou conectar projeto Hostinger.
3. Configurar secrets no provedor, sem gravar valores no repositorio.
4. Rodar validacoes locais.
5. Executar build.
6. Fazer deploy supervisionado.
7. Validar URL, logs e saude basica do app.
8. Registrar resultado no changelog.

## Pontos que exigem decisao ou confirmacao

- Se o backend sera dentro do Next.js ou em `apps/api`.
- Qual plano Hostinger sera usado: Business/Cloud gerenciado ou VPS.
- Se o primeiro deploy sera staging, preview ou producao.
- Quais variaveis secretas o app precisara.
- Como separar configuracoes da iBob do core reutilizavel do produto.
- Qual modelo futuro sera usado para clientes: multi-tenant ou instancias isoladas.
- Quando iniciar Supabase, Google Ads, Meta Ads, GA4, Orbita e CRM.
- Onde rodarao os workers do agente quando sairmos da tela inicial.
- Quando criar o primeiro commit Git.
- Se o projeto sera conectado a um repositorio remoto.

## Autorizacao registrada

O usuario autorizou criar estrutura, instalar dependencias e fazer deploy. Mesmo assim, antes de acoes com impacto externo, como deploy real, alteracao de DNS, criacao de projeto cloud ou configuracao de secrets, o alvo e o ambiente devem estar claros.
