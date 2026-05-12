# Decisoes

Registro de decisoes tecnicas do projeto.

## 2026-05-11 - Estrutura base neutra

Contexto:

O workspace estava vazio e sem repositorio Git.

Decisao:

Criar uma estrutura base neutra para app, pacotes compartilhados, infraestrutura, scripts, testes e documentacao.

Motivo:

Permitir organizacao inicial sem escolher framework ou cloud antes de entender o produto.

Status:

Aceita.

## Pendentes

- Banco de dados.
- Fluxo de CI/CD.
- Estrategia de ambientes: local, staging e producao.
- Modelo de multi-cliente: single-tenant inicial, multi-tenant futuro ou instancias isoladas.

## 2026-05-11 - Git local

Contexto:

O workspace nao tinha repositorio Git.

Decisao:

Inicializar Git local na branch `main`, sem criar commit automatico.

Motivo:

Manter historico desde o inicio e permitir que o primeiro snapshot seja revisado antes de commit.

Status:

Aceita.

## 2026-05-12 - iBob como piloto de produto

Contexto:

O usuario informou que, depois de validar com a iBob, pretende transformar a solucao em um produto vendavel e escalavel.

Decisao:

Tratar a iBob como primeiro piloto/MVP e manter o core do produto preparado para ser reutilizado por outros clientes.

Motivo:

Evitar decisoes iniciais que prendam o sistema a um unico cliente, dominio, fluxo ou configuracao, reduzindo retrabalho quando o produto precisar ser vendido e escalado.

Consequencias:

- Configuracoes especificas da iBob devem ficar separadas do core.
- Regras de negocio devem ser parametrizaveis quando fizer sentido.
- Arquitetura deve considerar autenticacao, permissoes, isolamento de dados, billing, logs e onboarding como proximos marcos.
- Hostinger continua adequada para validacao inicial, mas a portabilidade deve ser preservada.

Status:

Aceita.

## 2026-05-12 - Stack Next.js

Contexto:

O usuario escolheu Next.js para o aplicativo.

Decisao:

Criar o app principal em `apps/web` usando Next.js, TypeScript, App Router, Tailwind CSS e ESLint.

Motivo:

Next.js e suportado pela Hostinger como aplicacao Node.js e permite evoluir frontend e rotas server-side no mesmo app.

Status:

Aceita.

## 2026-05-12 - Cloud Hostinger

Contexto:

O usuario escolheu Hostinger como destino de hospedagem.

Decisao:

Preparar o projeto para deploy supervisionado via Hostinger Node.js Web Apps, preferencialmente por GitHub integration, mantendo alternativa por ZIP da pasta `apps/web`.

Motivo:

A documentacao atual da Hostinger informa suporte a Next.js em Node.js Web Apps, com deploy por GitHub ou upload de arquivos.

Status:

Aceita.
