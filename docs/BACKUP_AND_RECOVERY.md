# Backup e recuperacao

Data: 2026-05-19

## Objetivo

Definir o minimo operacional para recuperar o iBob Agent sem depender de memoria, prints ou configuracoes soltas. Este documento nao deve conter senhas, tokens, chaves privadas ou dumps de dados.

## Escopo protegido

- Codigo-fonte versionado no Git.
- Migrations em `infra/supabase/migrations`.
- Documentacao operacional em `docs`.
- Pacotes Hostinger versionados em `deploy/hostinger`.
- Banco Supabase remoto.
- Variaveis de ambiente configuradas na Hostinger e localmente.

## O que nao entra no Git

- `.env.local`.
- Senhas do Basic Auth.
- Chaves privadas, service role keys ou tokens.
- Dumps reais do banco.
- Exportacoes contendo dados pessoais ou comerciais sensiveis.

## Checklist recorrente

### Diario

- Confirmar que o ultimo deploy em producao responde.
- Confirmar login Supabase com usuario owner/admin.
- Conferir `/audit` para eventos criticos ou inesperados.
- Conferir se o ultimo ZIP versionado existe em `deploy/hostinger`.

### Semanal

- Exportar backup do Supabase pelo painel ou mecanismo aprovado do provedor.
- Registrar data/hora do backup fora do repositorio.
- Confirmar que o Git esta limpo apos commits.
- Validar que `docs/HOSTINGER.md` e `docs/CHANGELOG.md` refletem a ultima publicacao.
- Conferir que nenhum arquivo `.env` entrou no ZIP Hostinger.

### Antes de deploy

- Rodar `npm.cmd run lint`.
- Rodar `npm.cmd run build`.
- Rodar `npm.cmd run hostinger:build` quando houver espaco local suficiente.
- Gerar ZIP versionado.
- Conferir que o ZIP contem `package.json`, `server.js` e as rotas alteradas.
- Conferir que o ZIP nao contem `.env`.
- Registrar o pacote em `docs/HOSTINGER.md`.

### Depois de deploy

- Testar login.
- Testar `/`.
- Testar `/settings`.
- Testar `/roadmap`.
- Testar a rota alterada no pacote.
- Registrar validacao em `docs/HOSTINGER.md` e `docs/CHANGELOG.md`.

## Checklist de recuperacao

1. Identificar ultimo commit validado.
2. Identificar ultimo ZIP validado em `deploy/hostinger`.
3. Confirmar variaveis de ambiente na Hostinger sem expor valores.
4. Reimplantar o ultimo ZIP validado.
5. Testar login e rotas essenciais.
6. Se o problema for banco, restaurar backup Supabase usando o mecanismo aprovado no painel/provedor.
7. Validar migrations com `npx.cmd supabase --workdir infra migration list`.
8. Registrar o incidente em `audit_events` quando a escrita operacional estiver integrada.
9. Registrar a decisao em `docs/DECISIONS.md` se houver mudanca de processo.

## Rotas essenciais para smoke test

- `/`
- `/settings`
- `/roadmap`
- `/audit`
- `/data-trust`
- `/proposals`
- `/approvals`
- `/memory`

## Exercicio de restauracao

Frequencia recomendada: mensal durante o piloto.

Passos:

1. Escolher um ZIP validado anterior.
2. Conferir se o pacote ainda esta disponivel localmente.
3. Conferir se as variaveis de ambiente necessarias seguem cadastradas no provedor.
4. Fazer restore em ambiente de teste ou janela supervisionada.
5. Validar smoke test.
6. Documentar resultado no changelog operacional.

## Responsabilidade

- Usuario/proprietario: autorizar restore, deploy e mudancas em ambiente real.
- Codex: preparar comandos, checar pacotes, atualizar documentacao, validar build e orientar execucao.
- Provedor: manter recursos contratados de backup, hospedagem e banco conforme plano ativo.

## Estado atual

- Procedimento documentado.
- Ainda falta executar o primeiro exercicio real de restauracao.
- Ainda falta automatizar registro de eventos operacionais em `audit_events`.
