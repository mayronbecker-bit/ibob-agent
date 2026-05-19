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
- Criar Context Intelligence para entender oferta, margem, publico, capacidade e restricoes comerciais antes de qualquer sugestao de Ads.
- Versionar perguntas, respostas, lacunas e revisoes de contexto por cliente antes de transformar recomendacoes em produto vendavel. Schema inicial ja aplicado no Supabase em 2026-05-19.
- Pesquisar site oficial e concorrentes com evidencias revisaveis antes de alimentar memoria contextual ou Decision Engine.

### Fase 3 - Escala

- Avaliar se a Hostinger continua adequada ou se sera necessario migrar para infraestrutura com mais controle.
- Implementar multi-tenant completo ou isolamento por instancia, conforme risco e custo.
- Automatizar deploy, backups, monitoramento e recuperacao.
- Formalizar seguranca, privacidade e politicas operacionais.
- Conectar integracoes externas em modo leitura somente depois do produto estar robusto e validado.
- Conectar Ads apenas depois que o contexto comercial minimo estiver estruturado por cliente.

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
