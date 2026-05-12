# Integracao do blueprint da Claude

Data: 2026-05-12

## Origem

O pacote `iBob_Projeto_Agente_Trafego.zip` foi importado de:

`C:\Users\Mayron\Downloads\iBob_Projeto_Agente_Trafego.zip`

Os arquivos foram extraidos para:

`docs/claude-blueprint/ibob_agente_projeto/`

## Arquivos importados

- `iBob_Agente_Trafego_Pago.docx`: blueprint completo.
- `iBob_Arquitetura_Agente.html`: arquitetura interativa.
- `iBob_Passo_a_Passo.html`: guia interativo de implementacao.
- `README.md`: descricao do pacote original.

## Como este blueprint sera usado

O blueprint da Claude passa a ser a referencia funcional e arquitetural do piloto iBob.

Ele define:

- Agente de IA para trafego pago.
- Google Ads + Meta Ads como canais principais.
- Data Trust Layer antes de qualquer decisao.
- Memoria de Decisao como camada transversal.
- Decision Engine separado do Execution Engine.
- `rule_validator` deterministico antes de qualquer proposta executavel.
- Fila de aprovacao humana.
- Logs, auditoria e rollback.
- Niveis progressivos de autonomia.
- Experimentacao controlada como fase posterior.

## Adaptacao para nossa base atual

O blueprint original recomenda:

- Supabase.
- Railway workers Python.
- Vercel para dashboard Next.js.
- Claude API.
- Google Ads API.
- Meta Marketing API.
- GA4/Pixel.
- Orbita e CRM.

Nossa decisao atual:

- Hostinger sera usada para o primeiro deploy do app Next.js.
- Next.js continua como dashboard/interface principal.
- Supabase segue como candidato forte para banco, auth e memoria de decisao.
- Workers separados continuam previstos para as fases do agente, mas o provedor ainda sera decidido quando as integracoes reais forem iniciadas.
- Vercel fica substituido pela Hostinger no piloto, sem impedir migracao futura.

## Plano executavel adaptado

### Etapa 0 - Base local e deploy inicial

Status: em andamento.

- Next.js criado em `apps/web`.
- Hostinger escolhida como primeiro host.
- Checklist de deploy criado.
- Blueprint da Claude importado.
- Primeiro commit local criado.

Objetivo:

Publicar uma base simples e validada na Hostinger antes de iniciar integracoes sensiveis.

### Etapa 1 - Produto piloto iBob

- Trocar a tela inicial por uma estrutura real de dashboard.
- Criar navegacao inicial para:
  - Visao geral.
  - Propostas.
  - Aprovacoes.
  - Memoria de decisao.
  - Configuracoes.
- Separar configuracao da iBob do core reutilizavel do produto.
- Preparar a UI para multi-cliente futuro, mesmo que o piloto rode single-tenant.

### Etapa 2 - Fundacao de dados

- Definir banco.
- Criar schema inicial para:
  - Clientes.
  - Usuarios.
  - Fontes de dados.
  - Raw metrics.
  - Agent state.
  - Proposals.
  - Approvals.
  - Execution log.
  - Decision memory.
  - Agent versions.
- Manter secrets fora do repositorio.

### Etapa 3 - Integracoes em modo leitura

- Google Ads API.
- Meta Marketing API.
- GA4/Pixel.
- Orbita para margem.
- CRM/leads.

Todas as integracoes devem comecar em modo leitura ou `DRY_RUN=true`.

### Etapa 4 - Data Trust Layer

- Implementar validacoes antes da analise.
- Bloquear propostas quando dados estiverem inconsistentes.
- Expor estado do agente:
  - Verde.
  - Amarelo.
  - Vermelho.

### Etapa 5 - Decision Engine

- Integrar Claude API para gerar sugestoes.
- Impedir execucao direta pelo modelo.
- Consultar memoria de decisao antes de sugerir acoes.
- Registrar prompt version e threshold version.

### Etapa 6 - Validacao deterministica

- Implementar `rule_validator`.
- Validar limites de budget, estoque, margem, tracking e risco.
- Uma sugestao so vira proposta se passar pelas regras deterministicas.

### Etapa 7 - Fila de aprovacao humana

- Criar interface para Mayron e Cassiano aprovarem, rejeitarem ou adiarem propostas.
- Registrar quem decidiu, quando decidiu e qual justificativa foi usada.
- Nenhuma acao de escrita deve executar sem aprovacao enquanto o piloto nao estiver maduro.

### Etapa 8 - Execution Engine em dry run

- Implementar executor separado do Decision Engine.
- Simular execucoes antes de tocar contas reais.
- Registrar logs completos e estado anterior para rollback.

### Etapa 9 - Execucao controlada

- Ativar acoes reais apenas com escopo limitado.
- Manter aprovacao humana.
- Monitorar impacto financeiro.
- Criar processo de rollback.

### Etapa 10 - Produto escalavel

- Generalizar configuracoes da iBob.
- Criar onboarding de novos clientes.
- Definir modelo de cobranca.
- Avaliar multi-tenant ou instancias isoladas.
- Avaliar infraestrutura dedicada para workers e automacoes.

## Regras de seguranca herdadas do blueprint

- Claude API nunca executa acao diretamente.
- Sempre seguir o fluxo:
  - Modelo sugere.
  - `rule_validator` valida.
  - Proposta entra na fila.
  - Humano aprova.
  - Executor executa.
  - Log e memoria registram resultado.
- Nenhum token no codigo.
- Nenhuma chave no Git.
- Nenhuma escrita em Google Ads ou Meta Ads sem aprovacao explicita.
- Deploy em producao so apos validacoes locais e revisao do usuario.

## Proxima referencia de trabalho

Ao iniciar uma nova funcionalidade, consultar nesta ordem:

1. `docs/CLAUDE_BLUEPRINT_INTEGRATION.md`
2. `docs/PRODUCT_STRATEGY.md`
3. `docs/FIRST_DEPLOY_CHECKLIST.md`
4. `docs/claude-blueprint/ibob_agente_projeto/iBob_Agente_Trafego_Pago.docx`
5. `docs/claude-blueprint/ibob_agente_projeto/iBob_Passo_a_Passo.html`
6. `docs/claude-blueprint/ibob_agente_projeto/iBob_Arquitetura_Agente.html`

