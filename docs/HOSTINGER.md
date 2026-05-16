# Hostinger

Este projeto usa Next.js em `apps/web` e esta preparado para deploy supervisionado na Hostinger.

## Base oficial consultada

- Hostinger Node.js Web Apps: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- Hostinger Next.js Hosting: https://www.hostinger.com/web-apps-hosting/nextjs-hosting

## Requisitos

De acordo com a documentacao da Hostinger consultada em 2026-05-12:

- Next.js e suportado como aplicacao frontend e backend.
- Node.js Web Apps estao disponiveis em planos Business Web Hosting e Cloud.
- VPS tambem suporta Node.js, mas exige configuracao manual.
- Versoes Node.js suportadas: 18.x, 20.x, 22.x e 24.x.
- Deploy pode ser feito por GitHub ou upload de ZIP.

## Configuracao local atual

- App Next.js: `apps/web`
- Node local: 24.x
- Gerenciador: npm
- Build local: `npm run build`
- Dev local: `npm run dev`
- Build direto no app: `npm --prefix apps/web run build`

## Caminho recomendado para Hostinger

Preferencia: GitHub integration no hPanel.

1. Subir este repositorio para GitHub.
2. No hPanel, ir em Websites e adicionar Node.js Web App.
3. Selecionar Import Git Repository.
4. Autorizar a Hostinger no GitHub.
5. Selecionar o repositorio.
6. Confirmar framework Next.js.
7. Configurar Node.js 24.x, se a opcao estiver disponivel.
8. Configurar variaveis em Environment Variables no hPanel.
9. Fazer deploy apenas apos validacao local e confirmacao do usuario.

## Erro de estrutura invalida no GitHub import

Se a Hostinger mostrar:

```text
Estrutura de projeto invalida ou framework nao compativel.
```

A causa mais provavel neste repositorio e o formato monorepo: o app Next.js fica em `apps/web`, enquanto o detector da Hostinger procura a estrutura do framework na raiz do repositorio.

Solucao imediata:

1. Usar deploy por ZIP.
2. Enviar `deploy/hostinger/ibob-agent-web-hostinger.zip`.
3. Configurar como Next.js.

Solucao posterior para GitHub integration:

- Criar um repositorio separado contendo apenas o conteudo de `apps/web`, ou
- Ajustar a estrutura para o Next.js ficar na raiz do repositorio.

Por enquanto, o ZIP e o caminho mais rapido e seguro.

## Build settings

Se a Hostinger aceitar o app em subpasta ou comandos customizados:

- Install command: `npm run hostinger:install`
- Build command: `npm run hostinger:build`
- Start command: `npm run hostinger:start`
- Output directory, se solicitado: `apps/web/.next`

Os comandos acima foram criados no `package.json` do root para facilitar deploy quando o repositorio inteiro for usado.

Se o hPanel nao lidar bem com monorepo:

1. Gerar ZIP da pasta `apps/web`.
2. Fazer upload desse ZIP no fluxo Node.js Web App.
3. Usar:
   - Build command: `npm run build`
   - Start command: `npm run start`
   - Output directory: `.next`

O ZIP pode ser gerado com:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-hostinger-zip.ps1
```

Observacao importante:

O ZIP deve ser gerado pelo script acima. Nao use `Compress-Archive` manualmente, pois ele pode gerar metadados de permissao que causam erro de leitura em pastas como `src/components` durante o build na Hostinger. Tambem nao use um ZIP que coloque todos os caminhos com prefixo `./` ou entradas explicitas de diretorio antes de `package.json`, porque o detector da Hostinger pode nao reconhecer a estrutura do Next.js.

## Secrets

Nao salvar secrets no Git.

Variaveis devem ser configuradas:

- Localmente em `.env`.
- Na Hostinger em Environment Variables.

## Controle de acesso

Antes de publicar versoes protegidas, configurar na Hostinger:

```text
BASIC_AUTH_ENABLED=true
BASIC_AUTH_USERNAME=<usuario escolhido>
BASIC_AUTH_PASSWORD=<senha forte escolhida>
```

Sem `BASIC_AUTH_USERNAME` e `BASIC_AUTH_PASSWORD`, a versao protegida bloqueia o acesso em producao com status 503.

Detalhes: `docs/ACCESS_CONTROL.md`.

## Pendencias antes do primeiro deploy

- Confirmar plano Hostinger: Business, Cloud ou VPS.
- Confirmar dominio ou URL temporaria.
- Confirmar se o deploy sera via GitHub ou ZIP.
- Confirmar variaveis de ambiente necessarias.
- Criar primeiro commit Git.
- Conectar repositorio remoto, se o caminho escolhido for GitHub.

Checklist operacional: `docs/FIRST_DEPLOY_CHECKLIST.md`.

## Validacao local

Validado em 2026-05-12:

- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run hostinger:build`

Observacao: se `npm ci` falhar localmente no Windows com arquivo em uso, parar o servidor dev antes de repetir o comando.

## Deploys realizados

- 2026-05-16: publicado MVP com fundacao de dados local e rota `/settings` em `https://adsia.ia.br`.
- 2026-05-16: publicada versao com HTTP Basic Auth; acesso anonimo retorna HTTP 401.

Validacao publica:

- `/`
- `/data-trust`
- `/proposals`
- `/approvals`
- `/memory`
- `/roadmap`
- `/settings`

Todas as rotas responderam HTTP 200 apos o deploy.
