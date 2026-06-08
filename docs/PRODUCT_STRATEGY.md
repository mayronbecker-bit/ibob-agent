# Estrategia de produto

Data: 2026-05-12

## Diretriz principal

A iBob sera tratada como o primeiro piloto validado do produto, nao como o limite final da plataforma.

O objetivo e validar valor, fluxo operacional, experiencia do usuario e viabilidade tecnica com a iBob. Depois da validacao, o projeto deve poder evoluir para um produto vendavel, replicavel e escalavel para outros clientes.

## Implicacoes tecnicas

- Separar configuracao do cliente iBob do core do produto.
- Evitar regras de negocio hardcoded que so facam sentido para a iBob.
- Preparar o codigo para multi-cliente no futuro, mesmo que a primeira versao rode em modo single-tenant.
- Manter variaveis de ambiente e configuracoes externas como fonte de customizacao.
- Documentar decisoes que possam afetar escalabilidade, custos, seguranca e manutencao.
- Preferir modulos reutilizaveis para autenticacao, agentes, integracoes, templates, billing e configuracoes.
- Deixar integracoes externas para as fases finais, depois que produto, seguranca, auditoria, regras e experiencia estiverem validados com a iBob.

## Fases propostas

### Fase 1 - Piloto iBob

- Entregar uma experiencia funcional para a iBob.
- Validar fluxo principal com usuarios reais.
- Medir gargalos, custos, estabilidade e necessidades de suporte.
- Manter deploy simples e supervisionado na Hostinger.

### Fase 2 - Produto inicial

- Generalizar configuracoes especificas da iBob.
- Criar modelo de clientes, usuarios e permissoes.
- Estruturar onboarding de novos clientes.
- Definir precificacao, limites de uso e suporte.
- Melhorar observabilidade: logs, erros, metricas e auditoria.
- Validar Decision Engine supervisionado, rule_validator e fluxo de aprovacao usando dados existentes, mocks controlados ou importacoes manuais antes de conectar APIs externas.
- V45 cria `/decision` como pre-motor deterministico: ele valida contexto, pesquisa, funil e Data Trust antes de qualquer proposta, sem MCP e sem execucao externa.
- V46 cria `/validator` para transformar gates em regras deterministicas versionadas antes de qualquer proposta real.
- V47 aplica o schema `rule_validator` no Supabase remoto e passa a ler o catalogo ativo de regras na tela `/validator`.
- V49 registra dry-runs do `rule_validator` antes de qualquer proposta real, criando evidencia auditavel de decisao.
- V50 torna esses dry-runs conferiveis na propria UI, com historico, checks e trava explicita de Ads/MCP antes da promocao para proposta.
- V51 permite certificar uma proposta existente apos dry-run aprovado, fechando a ponte para aprovacao humana sem liberar execucao externa.
- V52 cria Execution Engine em dry-run, registrando simulacoes auditaveis antes de qualquer integracao de escrita.
- V53 fecha a etapa de dry-run com preflight e rollback, preparando a futura integracao em modo leitura/escrita controlada.
- V54 consolida o nucleo supervisionado como concluido: contexto, pesquisa, estrategia, funil, decisao, validacao, aprovacao e dry-run.
- V55 inicia a experiencia conversacional do produto com `/agent`, permitindo perguntas de vendas e marketing antes de gerar propostas.
- V56 conecta IA externa OpenAI / ChatGPT API ao `/agent` como camada analitica server-side, mantendo fallback local e sem liberar MCPs ou escrita externa.
- V57 adiciona diagnostico visivel do status OpenAI, reduzindo suporte manual e preparando a experiencia para operacao por novos clientes.
- V58 torna a IA externa resiliente por fallback de modelos e mensagem de erro sanitizada, melhorando operacao em ambientes de cliente.
- V59 coloca o motivo tecnico do fallback no proprio balao de resposta, acelerando suporte sem expor secrets.
- V60 antecipa Google Ads em modo leitura para analisar campanhas reais, mantendo escrita externa bloqueada e usando o agente como cerebro analitico.
- Criar Context Intelligence para entender oferta, margem, publico, capacidade e restricoes comerciais antes de qualquer sugestao de Ads.
- Versionar perguntas, respostas, lacunas e revisoes de contexto por cliente antes de transformar recomendacoes em produto vendavel. Schema inicial ja aplicado no Supabase em 2026-05-19.
- Pesquisar site oficial e concorrentes com evidencias revisaveis antes de alimentar memoria contextual ou Decision Engine. Site oficial da iBob registrado para o primeiro run supervisionado em 2026-05-19.

### Fase 3 - Escala

- Avaliar se a Hostinger continua adequada ou se sera necessario migrar para infraestrutura com mais controle.
- Implementar multi-tenant completo ou isolamento por instancia, conforme risco e custo.
- Automatizar deploy, backups, monitoramento e recuperacao.
- Formalizar seguranca, privacidade e politicas operacionais.
- Conectar integracoes externas em modo leitura somente depois do produto estar robusto e validado.
- Conectar Ads apenas depois que o contexto comercial minimo estiver estruturado por cliente.
- Usar MCPs de Google Ads e Meta Ads como conectores supervisionados, nao como cerebro do produto. O agente iBob continua responsavel por contexto, CRM/funil, regras, auditoria e decisao.
- Usar OpenAI como cerebro analitico conversacional antes do gran finale de MCPs, sempre com guardrails, fallback e sem secrets no client.

## Decisoes a evitar no inicio

- Criar dependencias profundas com apenas uma marca, dominio ou cliente.
- Misturar dados de configuracao com codigo.
- Salvar segredos no repositorio.
- Construir automacoes que executem acoes sensiveis sem aprovacao humana.
- Escolher ferramentas que impecam migracao futura sem ganho claro no piloto.

## Indicadores de validacao

- Usuario entende o valor do produto sem explicacao longa.
- Fluxo principal resolve um problema recorrente.
- O custo operacional por cliente e previsivel.
- O suporte manual necessario e aceitavel.
- A solucao pode ser demonstrada e vendida para outro cliente com pouca adaptacao.
