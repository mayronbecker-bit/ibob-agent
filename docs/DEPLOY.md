# Deploy

Este documento define o fluxo de deploy supervisionado.

## Status

Deploy alvo escolhido: Hostinger.

Nenhum deploy foi executado ainda.

## Fluxo proposto

1. Confirmar tipo de hospedagem Hostinger: Business/Cloud gerenciado ou VPS.
2. Confirmar ambiente inicial: staging, preview, URL temporaria ou producao.
3. Configurar variaveis secretas diretamente na Hostinger.
4. Rodar lint local.
5. Rodar build local.
6. Criar commit e publicar em repositorio remoto, se usar GitHub integration.
7. Executar deploy com autorizacao explicita do usuario.
8. Validar URL, logs e comportamento basico.
9. Registrar resultado em `docs/CHANGELOG.md`.

## Hostinger

Detalhes especificos estao em `docs/HOSTINGER.md`.

Checklist do primeiro deploy: `docs/FIRST_DEPLOY_CHECKLIST.md`.

## Autorizacoes necessarias

- Criar projeto em provedor cloud.
- Fazer login em CLI de cloud.
- Configurar secrets no provedor.
- Executar primeiro deploy.
- Promover staging para producao.
- Alterar dominio, DNS ou ambiente de producao.
