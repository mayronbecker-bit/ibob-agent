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

## 2026-05-25 - Decision Engine supervisionado sem execucao externa

Contexto:

A iBob ja validou contexto comercial, pesquisa supervisionada, revisao CMO e funil real manual. O usuario confirmou que as integracoes de Google Ads MCP e Meta Ads MCP devem ficar para os ultimos eventos, com o agente iBob atuando como cerebro e conferente dos numeros.

Decisao:

Criar a fundacao do Decision Engine em `/decision` como pre-motor deterministico e supervisionado. Ele deve ler contexto, pesquisa, memoria, funil e Data Trust para avaliar gates e hipoteses, mas nao deve chamar IA externa, MCPs ou APIs de Ads.

Motivo:

Antes de gerar propostas ou tocar contas reais, o produto precisa provar que entende a empresa, separa contexto de Ads, confere CRM/funil e bloqueia decisoes quando os numeros nao sustentam escala.

Consequencias:

- `/decision` passa a mostrar prontidao do motor, gates, bloqueios, evidencias e hipoteses.
- Decision Engine fica marcado como `in_progress` no Roadmap.
- Google Ads MCP e Meta Ads MCP continuam como conectores futuros e supervisionados.
- Execucao externa segue bloqueada ate rule_validator, aprovacao humana, dry-run e auditoria ficarem prontos.

Status:

Aceita.

## 2026-05-25 - Rule Validator antes de propostas reais

Contexto:

A v45 validou a fundacao do Decision Engine supervisionado. O proximo risco e deixar uma hipotese virar proposta sem regras deterministicas claras para contexto, pesquisa, funil, Data Trust, margem, risco e execucao externa.

Decisao:

Criar a fundacao local do `rule_validator` antes de gerar ou persistir novas propostas. A v46 prepara migration local, contratos TypeScript e a tela `/validator` para dry-run, mas nao aplica o schema no Supabase remoto sem autorizacao explicita.

Motivo:

O agente pode ser inteligente, mas a promocao de recomendacao para proposta precisa de travas previsiveis, auditaveis e versionadas. Isso protege margem, capacidade comercial, qualidade do funil e seguranca operacional.

Consequencias:

- `rule_validator` passa a ter catalogo de regras v1.
- `/validator` mostra checks, evidencias, falhas e caminhos de correcao.
- A v49 registra dry-runs e checks no Supabase antes de qualquer promocao para proposta.
- A v52 registra apenas simulacoes em `execution_logs`, mantendo execucao externa bloqueada ate autorizacao futura especifica.
- Propostas futuras devem passar pelo `rule_validator` antes de aprovacao humana.
- Execucao externa segue bloqueada mesmo quando as regras passam.
- Migration remota depende de autorizacao posterior.

Status:

Aceita localmente na v46 e aplicada no Supabase remoto em 2026-05-26 apos autorizacao explicita.

## 2026-05-23 - CMO Strategy Readiness antes do Decision Engine

Contexto:

O usuario preencheu todo o contexto comercial da iBob e pediu uma revisao como CMO estrategico, com foco em vender mais com menor custo de Ads e maior previsibilidade.

Decisao:

Adicionar a etapa `CMO Strategy Readiness` antes do Decision Engine. Essa camada cruza contexto, pesquisa, memoria, concorrentes, ticket, margem, CAC, budget, capacidade e ciclo comercial para dizer se a base esta pronta para estrategia e quais bloqueios impedem escala.

Motivo:

Um agente melhor que uma agencia precisa transformar contexto em guardrails economicos e comerciais antes de gerar propostas de midia. Ads deve otimizar para cliente qualificado, oportunidade e venda, nao apenas para lead barato.

Consequencias:

- Criada a tela `/strategy`.
- O Roadmap passa a ter uma etapa explicita entre Context Research e Decision Engine.
- Execution e integracoes externas continuam bloqueadas ate tracking de qualidade e venda estar pronto.
- Rule validator deve usar CAC alvo, margem, capacidade, no-fit, sinais de lead bom/ruim e janela de venda.

Status:

Aceita e implementada localmente na v38.

## 2026-05-24 - Tracking e Funil Real manual-first

Contexto:

A tela de estrategia mostrou que a iBob so chega a base 100 quando houver funil real por origem: lead qualificado, oportunidade, proposta e venda. O usuario quer deixar integracoes externas para os ultimos eventos.

Decisao:

Adicionar a etapa `Tracking e Funil Real` antes do Decision Engine e antes das integracoes externas. A primeira versao deve ser manual-first, com schema local, rota `/funnel` e template CSV para importar eventos revisados.

Motivo:

O agente precisa aprender qualidade e resultado comercial antes de recomendar escala de midia. Isso reduz o risco de otimizar por lead barato que nao compra.

Consequencias:

- Criada migration local `20260524100000_create_funnel_tracking.sql`.
- Criada rota `/funnel`.
- Criado template `docs/templates/funnel_events_import_template.csv`.
- Nenhuma integracao externa e ativada nesta etapa.

Status:

Aceita e aplicada no Supabase remoto em 2026-05-24.

## 2026-05-24 - MCPs de Ads como conectores supervisionados

Contexto:

O produto usara integracoes MCP para Google Ads e Meta Ads nas fases finais, mas o valor central deve continuar no agente iBob: contexto inteligente, analise de CRM/funil, validacao de numeros e governanca.

Decisao:

Tratar MCPs de Google Ads e Meta Ads como conectores/adaptadores de leitura e execucao supervisionada. O agente iBob permanece como cerebro, analista, orquestrador e guardiao dos numeros.

Motivo:

MCP deve executar operacoes bem definidas e retornar evidencias. Ele nao substitui contexto comercial, CRM, rule_validator, aprovacao humana, auditoria ou reconciliacao financeira.

Consequencias:

- Google Ads MCP e Meta Ads MCP entram nas etapas finais de integracao em modo leitura primeiro.
- Acoes de escrita so ocorrem apos contexto, funil real, Data Trust, rule_validator e aprovacao humana.
- O agente compara dados de Ads com CRM/funil antes de sugerir escala.
- Toda ordem enviada a um MCP deve ter origem, justificativa, limites, resultado esperado e evento de auditoria.
- Se os numeros de Ads e CRM divergirem, o agente bloqueia escala ate reconciliar.

Status:

Aceita como diretriz arquitetural.

## 2026-05-24 - Entrada manual de eventos de funil

Contexto:

A tabela `funnel_events` ja estava aplicada no Supabase remoto, mas `/funnel` ainda mostrava apenas checklist e exemplos. Para comecar a construir a fonte de verdade comercial, o usuario aprovou seguir com o proximo passo.

Decisao:

Transformar `/funnel` em uma tela operacional para registrar eventos manuais reais no Supabase, antes de qualquer integracao externa.

Motivo:

Uma primeira amostra manual permite validar nomenclatura, etapas, origem, qualidade, valor e margem antes de conectar MCPs/API de Ads ou CRM.

Consequencias:

- `/funnel` grava em `funnel_events`;
- eventos criados registram `funnel.event_created` em `audit_events`;
- a tela lista os ultimos eventos reais;
- o checklist passa a reagir aos eventos reais existentes;
- nenhuma acao externa de Ads foi conectada.

Status:

Aceita e implementada localmente na v43.

## 2026-05-24 - Avanco paralelo das etapas 5 a 9

Contexto:

O usuario solicitou avancar em paralelo as etapas 5 a 9. Essas etapas cobrem hardening, contexto, pesquisa, estrategia CMO e funil real.

Decisao:

Avancar com uma entrega coesa: fazer eventos reais de `/funnel` recalibrarem `/strategy`, adicionar resumo operacional em `/funnel` e mostrar no `/roadmap` a frente ativa conjunta das etapas 5 a 9.

Motivo:

O produto precisa evoluir como sistema, nao como telas isoladas. O funil real deve fechar o ciclo com contexto e pesquisa antes de MCPs e integracoes externas.

Consequencias:

- `/strategy` usa eventos reais de `funnel_events`;
- a nota de tracking/funil deixa de ser fixa;
- `/funnel` mostra resumo de eventos, etapas, vendas, receita e margem;
- `/roadmap` mostra o bloco de avanco paralelo;
- MCPs seguem fora da execucao ate a base estar consistente.

Status:

Aceita e implementada localmente na v44.

## 2026-05-19 - Context Intelligence antes do Decision Engine

Contexto:

O Roadmap previa Decision Engine supervisionado, mas o usuario reforcou que o cerebro do software precisa entender o contexto comercial da empresa antes de conectar Ads ou sugerir otimizacoes. Para a iBob, parte desse contexto ja foi alimentada, mas ainda precisa virar estrutura de produto.

Decisao:

Adicionar `Context Intelligence` como etapa propria antes do Decision Engine. Essa camada deve coletar perguntas e respostas inteligentes sobre oferta, margem, publico, capacidade, metas, restricoes, sazonalidade, processo comercial e previsibilidade.

Motivo:

O objetivo do produto nao e apenas interpretar Ads; e vender mais com menor custo e mais previsibilidade. Sem contexto comercial, o agente pode escalar leads baratos que nao compram, pausar campanhas lucrativas ou ignorar gargalos operacionais.

Consequencias:

- O Decision Engine passa a depender de contexto comercial estruturado.
- O rule_validator deve usar margem, capacidade, perfil ideal e restricoes do contexto.
- Integracoes externas continuam nas fases finais.
- O Roadmap passa a explicitar essa etapa.

Status:

Aceita.

## 2026-05-19 - Schema de Context Intelligence

Contexto:

A etapa de Context Intelligence precisava sair do conceito e virar base de dados versionada para perguntas, respostas, revisao, lacunas e evolucao do contexto por cliente.

Decisao:

Criar a migration `20260519133000_create_context_intelligence.sql` com `business_contexts`, `context_questions`, `context_answers`, `context_versions` e `context_gaps`, usando RLS por `client_id` e seeds iniciais de perguntas comerciais intencionais.

Motivo:

O produto precisa saber o que sabe, o que ainda nao sabe e quais lacunas impedem uma recomendacao segura. Isso prepara o agente para vender mais com menor custo e mais previsibilidade sem depender primeiro de integracoes de Ads.

Consequencias:

- Contexto passa a ser versionavel e revisavel.
- Perguntas iniciais ficam no banco e nao soltas em texto livre.
- Owners/admins podem gerenciar contexto; membros podem ler.
- Decision Engine e rule_validator passam a ter dependencia clara de contexto minimo.
- A migration fica local ate autorizacao explicita para aplicar no Supabase remoto.

Status:

Aceita e aplicada no Supabase remoto em 2026-05-19.

## 2026-05-19 - Primeira UI de Context Intelligence

Contexto:

O schema de Context Intelligence ja estava aplicado no Supabase, mas ainda faltava uma superficie no produto para responder perguntas, enxergar lacunas e validar a completude do diagnostico.

Decisao:

Criar a rota `/context` com leitura real de contexto, perguntas, respostas e lacunas. A tela permite salvar respostas em `context_answers` e recalcula a completude do `business_contexts` depois de cada resposta.

Motivo:

Context Intelligence precisa ser usado pelo usuario antes de virar dependencia do Decision Engine. A primeira UI permite transformar conhecimento comercial em dados versionados, sem conectar Ads e sem executar acoes externas.

Consequencias:

- `Diagnostico` entra no menu lateral.
- O usuario pode responder perguntas intencionais diretamente no app.
- Lacunas de contexto ficam visiveis antes do Decision Engine.
- A proxima etapa passa a ser migrar o contexto comercial ja levantado da iBob para `context_answers`.

Status:

Aceita.

## 2026-05-19 - Context Research Layer antes do Decision Engine

Contexto:

O usuario reforcou que o diagnostico precisa ser inteligente: alem das respostas manuais, o agente deve pesquisar a empresa pelo site oficial, pesquisar concorrentes e acrescentar aprendizados a memoria.

Decisao:

Preparar a camada `Context Research Layer` com execucoes de pesquisa, fontes, achados, perfis de concorrentes, insights concorrenciais e itens de memoria contextual. Achados pesquisados entram com evidencia, confianca e status de revisao antes de serem convertidos para contexto ativo.

Motivo:

O produto deve entender o negocio e o mercado antes de recomendar acoes de Ads. Pesquisar sem trilha de evidencia geraria risco de erro; por isso os achados precisam ser revisaveis e auditaveis.

Consequencias:

- O Roadmap ganha etapa propria para pesquisa contextual.
- `context_memory_items` vira a memoria contextual da empresa e do mercado.
- Achados de site/concorrentes nao viram verdade ate revisao humana.
- Decision Engine deve usar apenas contexto, memoria e insights aceitos.
- A migration fica local ate autorizacao explicita para aplicar no Supabase remoto.

Status:

Aceita e aplicada no Supabase remoto em 2026-05-19. Site oficial da iBob registrado como run inicial enfileirado.

## 2026-05-19 - Console de pesquisa supervisionada

Contexto:

A camada de pesquisa contextual ja existia no banco e tinha o site oficial da iBob enfileirado, mas ainda faltava uma superficie operacional para acompanhar runs, fontes, achados, concorrentes e memoria contextual.

Decisao:

Criar a rota `/research`, adicionar item `Pesquisa` ao menu lateral e permitir criacao de novos runs supervisionados. A tela le as tabelas reais de Context Research e usa fallback controlado para mock quando necessario.

Motivo:

Antes de automatizar qualquer busca externa, o produto precisa mostrar claramente o que sera pesquisado, o que foi encontrado e o que ainda depende de revisao humana.

Consequencias:

- `/research` passa a ser a console de operacao do Context Research Layer.
- Criar run nao executa busca externa automaticamente.
- Achados, concorrentes e memoria continuam separados ate revisao/promocao.
- A proxima etapa pode implementar o agente pesquisador em modo supervisionado.

Status:

Aceita.

## 2026-05-20 - Achados pesquisados precisam nascer supervisionados

Contexto:

A v31 validou a console `/research`. O proximo passo era transformar a pesquisa publica da iBob e de concorrentes em dados do produto, sem tratar automaticamente o que foi encontrado como verdade operacional.

Decisao:

Criar uma carga local de achados supervisionados com fontes, evidencias, concorrentes candidatos, insights e itens de memoria em `draft`. A aplicacao no Supabase remoto exige autorizacao explicita, e a promocao para memoria ativa exige revisao humana.

Motivo:

O objetivo do agente e vender mais com menor custo e maior previsibilidade. Para isso, ele precisa entender empresa e mercado antes de analisar Ads, mas tambem precisa evitar que pesquisa externa nao validada influencie budget, pausas, segmentacao ou criativos.

Consequencias:

- A pesquisa publica entra como evidencia revisavel.
- `needs_review`, `candidate` e `draft` sao os estados padrao dessa etapa.
- Decision Engine ainda nao pode usar esses achados como verdade ativa.
- O Roadmap passa a registrar a pendencia de revisao dos achados.

Status:

Aceita e aplicada no Supabase remoto em 2026-05-20.

## 2026-05-19 - Checklist de backup e recuperacao

Contexto:

O piloto ja tem deploys versionados, Supabase com migrations, auditoria e documentacao de publicacao. Antes de evoluir para rule_validator e Decision Engine, falta um procedimento minimo para recuperar o produto em caso de erro de deploy, perda de configuracao ou incidente no banco.

Decisao:

Criar `docs/BACKUP_AND_RECOVERY.md` como checklist operacional sem segredos, cobrindo escopo protegido, recorrencia, passos antes/depois de deploy, smoke test e roteiro de recuperacao.

Motivo:

Um produto vendavel precisa ter caminho de recuperacao claro antes de conectar integracoes externas ou automatizacoes sensiveis.

Consequencias:

- Backup/recuperacao passa a fazer parte do hardening do Roadmap.
- O checklist nao armazena dumps, tokens ou senhas.
- Ainda falta executar o primeiro exercicio real de restauracao.

Status:

Aceita.

## 2026-05-19 - Fundacao de auditoria por cliente

Contexto:

O piloto ja registra approvals, decision_memory e execution_logs, mas ainda falta uma trilha generica de eventos para seguranca, produto e operacao.

Decisao:

Preparar a migration `audit_events` com `client_id`, usuario ator opcional, tipo de evento, severidade, entidade relacionada, descricao, metadata e timestamp. A leitura segue RLS por cliente, e a escrita inicial fica restrita a owners/admins.

Motivo:

Antes de conectar integracoes externas ou execucao controlada, o produto precisa explicar o que aconteceu, quem fez, quando ocorreu e qual entidade foi afetada.

Consequencias:

- A migration fica versionada localmente antes de ser aplicada no Supabase.
- Auditoria vira parte explicita do hardening do produto piloto no Roadmap.
- Eventos de Decision Engine, rule_validator e Execution Engine poderao usar essa base em etapas futuras.

Status:

Aceita e aplicada no Supabase remoto em 2026-05-19.

## 2026-05-19 - Audit UI no produto

Contexto:

A tabela `audit_events` ja esta aplicada no Supabase remoto com RLS por cliente, mas ainda faltava uma superficie no produto para o usuario acompanhar os eventos.

Decisao:

Criar a rota `/audit`, adicionar item no menu lateral e ler eventos reais do Supabase usando a sessao autenticada. A tela deve mostrar severidade, ator, tipo de evento, entidade, metadata resumida e fallback controlado para mock.

Motivo:

Auditoria so vira valor operacional quando fica visivel para o usuario. Essa tela prepara o produto para demonstracao, suporte e futuras etapas de governanca antes das integracoes externas.

Consequencias:

- `/audit` passa a fazer parte das rotas protegidas do produto.
- Eventos reais sao limitados por RLS ao cliente do usuario logado.
- A etapa de hardening do Roadmap passa a incluir UI de auditoria.

Status:

Aceita.

## 2026-05-18 - Headers defensivos no servidor Node

Contexto:

O app roda na Hostinger por `server.js`, que tambem aplica o Basic Auth temporario antes de entregar as rotas do Next.js.

Decisao:

Adicionar headers defensivos diretamente no servidor Node: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e `Strict-Transport-Security` quando a requisicao chegar por HTTPS.

Motivo:

Reduzir riscos comuns de navegador, como clickjacking, MIME sniffing, exposicao excessiva de origem por referrer e uso indevido de recursos sensiveis como camera, microfone, geolocalizacao e pagamento.

Consequencias:

- As respostas protegidas por Basic Auth e as rotas do app recebem o mesmo baseline de seguranca.
- Nao foi adicionada Content Security Policy nesta etapa para evitar quebrar scripts gerados pelo Next.js sem uma auditoria especifica.
- O Roadmap registra este item como parte do hardening do produto piloto.

Status:

Aceita.

## 2026-05-18 - Estados de tela padronizados

Contexto:

As telas conectadas ao Supabase ja tinham fallback controlado para mock, mas cada uma comunicava falha, ausencia de dados ou fallback de forma diferente.

Decisao:

Criar componentes reutilizaveis para aviso de estado de dados e estado vazio. Aplicar o padrao nas telas principais: dashboard, Data Trust, propostas, aprovacoes, memoria e settings.

Motivo:

Melhorar confianca operacional. O usuario precisa saber quando esta vendo dado real, dado mockado, lista vazia ou falha temporaria de leitura, especialmente antes de transformar o piloto em produto vendavel.

Consequencias:

- Fallbacks ficam explicitos.
- Listas vazias deixam de parecer tela quebrada.
- O Roadmap registra este item como parte do hardening do produto piloto.

Status:

Aceita.

## 2026-05-18 - Redirect pos-login restrito a rotas internas

Contexto:

O formulario de login aceita o parametro `next` para devolver o usuario a rota que ele tentou acessar antes de autenticar.

Decisao:

Validar o valor de `next` no cliente e aceitar apenas caminhos internos relativos do app. URLs externas, caminhos iniciados por `//`, valores com quebra de linha e a propria rota `/login` caem para `/`.

Motivo:

Evitar redirecionamento aberto apos login e reduzir risco de phishing ou navegacao para destinos nao controlados pelo produto.

Consequencias:

- O fluxo normal `/login?next=/alguma-rota` continua funcionando.
- Links externos em `next` deixam de ser aceitos.
- Este e o primeiro item concluido do hardening do produto piloto.

Status:

Aceita.

## 2026-05-18 - Integracoes externas como fase final

Contexto:

O piloto ja tem autenticacao, RLS, dados reais no Supabase, dashboard, Data Trust, propostas, aprovacoes, memoria e Roadmap publicados. Ainda assim, o produto precisa ficar mais robusto antes de conectar contas externas de midia, analytics, CRM ou ecommerce.

Decisao:

Adiar as integracoes externas para as fases finais e priorizar agora o hardening do produto piloto: seguranca, estados de erro, auditoria, testes, backup, documentacao operacional, experiencia de uso, Decision Engine supervisionado, rule_validator e preparacao comercial.

Motivo:

Reduzir risco operacional e financeiro. O produto pode evoluir usando dados reais ja persistidos, mocks controlados e importacoes manuais antes de tocar APIs externas. Isso deixa a iBob mais segura e tambem prepara uma base vendavel e escalavel.

Consequencias:

- A etapa "Integracoes em modo leitura" deixa de ser o proximo marco e passa a ser fase final antes da execucao controlada.
- O Roadmap passa a destacar "Hardening do produto piloto" como etapa em andamento.
- Decision Engine e rule_validator podem ser validados sem credenciais externas.
- Nenhuma automacao deve executar acoes externas sem aprovacao humana, logs e rollback desenhados.

Status:

Aceita.

## Pendentes

- Banco de dados.
- Fluxo de CI/CD.
- Estrategia de ambientes: local, staging e producao.
- Modelo de multi-cliente: single-tenant inicial, multi-tenant futuro ou instancias isoladas.
- Provedor final dos workers do agente, caso sejam separados da Hostinger.

## 2026-05-18 - Roadmap como registro vivo

Contexto:

O usuario reforcou que o Roadmap deve ser atualizado a cada passo do projeto.

Decisao:

Toda etapa tecnica concluida deve atualizar tambem o Roadmap operacional do produto, incluindo status, descricao e proximo marco quando aplicavel.

Motivo:

Manter a execucao tecnica alinhada ao plano vendavel e escalavel do produto, evitando que o app evolua sem que o usuario enxergue claramente o progresso e as proximas dependencias.

Consequencias:

- Alteracoes futuras devem revisar `/roadmap` junto com documentacao e changelog.
- O Roadmap deve refletir o estado real validado em producao, nao apenas o plano inicial.
- Commits de feature devem incluir ajuste de Roadmap quando mudarem o estado do produto.

Status:

Aceita.

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

## 2026-05-12 - Blueprint Claude como plano funcional

Contexto:

O usuario forneceu o pacote `iBob_Projeto_Agente_Trafego.zip`, criado anteriormente pela Claude, contendo blueprint DOCX, arquitetura HTML interativa e guia HTML passo a passo.

Decisao:

Importar o pacote em `docs/claude-blueprint/` e adotar o blueprint como referencia funcional e arquitetural do agente de trafego pago.

Adaptacao:

O blueprint original sugere Supabase, Railway e Vercel. A decisao atual do projeto usa Hostinger como hospedagem inicial do app Next.js. Supabase e workers separados continuam como opcoes previstas para as proximas fases.

Motivo:

Preservar o planejamento ja validado, evitar retrabalho e manter uma rota clara para transformar o piloto iBob em produto vendavel.

Status:

Aceita.

## 2026-05-12 - MVP local em modo seguro

Contexto:

Antes do deploy na Hostinger, o usuario pediu para montar o projeto e rodar localmente.

Decisao:

Implementar um MVP navegavel em Next.js com dados mockados e fluxo do agente em modo seguro.

Motivo:

Permitir validacao visual e operacional do produto antes de conectar APIs reais, banco, secrets ou execucoes em contas de midia.

Consequencias:

- Google Ads, Meta Ads, GA4, Orbita, CRM, Supabase e Claude API ficam simulados nesta fase.
- Nenhuma acao real e executada.
- O fluxo de aprovacao humana e `rule_validator` ja aparecem na interface para orientar a evolucao.

Status:

Aceita.

## 2026-05-16 - Fundacao de dados local

Contexto:

Depois do MVP publicado, o proximo passo foi preparar a base para transformar os mocks em dados reais sem prender o produto apenas a iBob.

Decisao:

Criar contratos canonicos de dominio em `apps/web/src/lib/domain/types.ts` e separar a configuracao especifica da iBob em `apps/web/src/config/clients/ibob.ts`.

Motivo:

Permitir migracao futura para Supabase, Row Level Security, multi-cliente e auditoria sem reescrever as telas do dashboard.

Consequencias:

- O MVP continua usando dados mockados.
- Cada entidade persistente passa a ter `clientId` para isolamento futuro por cliente.
- A rota `/settings` mostra a configuracao ativa do piloto e reforca o modo `DRY_RUN`.
- Supabase ainda nao foi integrado; esta decisao apenas prepara o contrato.

Status:

Aceita.

## 2026-05-16 - Controle de acesso temporario

Contexto:

O dashboard publicado em `adsia.ia.br` ficou acessivel publicamente durante a fase de MVP.

Decisao:

Adicionar protecao temporaria por HTTP Basic Auth usando `apps/web/src/proxy.ts`, com usuario e senha definidos apenas por variaveis de ambiente.

Motivo:

Reduzir exposicao publica imediatamente, sem antecipar a implementacao completa de autenticacao com Supabase Auth.

Consequencias:

- A versao protegida exige `BASIC_AUTH_USERNAME` e `BASIC_AUTH_PASSWORD` na Hostinger.
- Se as credenciais nao forem configuradas em producao, o app bloqueia acesso com status 503.
- Esta abordagem e temporaria e deve ser substituida por autenticacao real com usuarios, roles e RLS.

Status:

Aceita.

## 2026-05-16 - Autenticacao temporaria em runtime Node

Contexto:

A versao protegida por `apps/web/src/proxy.ts` chegou a validar HTTP 401 sem credenciais, mas depois a Hostinger passou a retornar HTTP 503 mesmo com variaveis configuradas no painel.

Decisao:

Substituir o proxy do Next.js por `apps/web/server.js`, mantendo HTTP Basic Auth temporario e lendo `BASIC_AUTH_ENABLED`, `BASIC_AUTH_USERNAME` e `BASIC_AUTH_PASSWORD` em runtime no processo Node.

Motivo:

Reduzir dependencias do runtime especifico do proxy do Next.js na Hostinger e manter a protecao simples enquanto a autenticacao real do produto ainda nao foi implementada.

Consequencias:

- `npm run start` passa a executar `node server.js`.
- O pacote ZIP da Hostinger precisa incluir `server.js`.
- A protecao continua temporaria e sera substituida por Supabase Auth, roles e isolamento por cliente.

Status:

Aceita.

## 2026-05-16 - Supabase como fundacao de Auth e banco

Contexto:

Com o piloto publicado e protegido, o proximo passo e substituir mocks por dados reais e preparar o produto para multiplos clientes.

Decisao:

Adotar Supabase como fundacao inicial de autenticacao, banco Postgres e Row Level Security, mantendo Hostinger para hospedar o app Next.js.

Motivo:

Supabase entrega Auth, Postgres, policies de RLS e fluxo de migrations com baixa friccao para o MVP, sem prender o app a um unico cliente.

Consequencias:

- O Basic Auth da Hostinger continua temporario ate o login real ser validado.
- O schema inicial fica versionado em `infra/supabase/migrations`.
- Todos os dados persistentes devem carregar `client_id` para isolamento por cliente.
- Secrets do Supabase ficam apenas no ambiente local/Hostinger, nunca no Git.

Status:

Aceita.
