# Changelog

## 2026-05-11

- Criada estrutura base do projeto.
- Criados documentos iniciais de setup, deploy, decisoes e historico.
- Criados `.gitignore` e `.env.example`.
- Inicializado repositorio Git na branch `main`.
- Criado plano inicial em `docs/INITIAL_PLAN.md`.

## 2026-05-12

- Criado app Next.js em `apps/web`.
- Instaladas dependencias do Next.js, React, TypeScript, Tailwind CSS e ESLint.
- Criado `package.json` no root com scripts delegando para `apps/web`.
- Criada documentacao especifica de Hostinger em `docs/HOSTINGER.md`.
- Atualizados setup, deploy, decisoes e README para Next.js + Hostinger.
- Substituida tela padrao do Next.js por tela inicial do iBob Agent.
- Validados lint e build pelo root do projeto.
- Validado comando `hostinger:build` com instalacao limpa via `npm ci`.
- Registrada observacao de auditoria npm sem aplicar correcao forcada.
- Criada estrategia de produto tratando a iBob como piloto/MVP para futuro produto escalavel.
- Criado checklist operacional para o primeiro deploy na Hostinger.
- Importado pacote da Claude em `docs/claude-blueprint/`.
- Criada integracao do blueprint em `docs/CLAUDE_BLUEPRINT_INTEGRATION.md`.
