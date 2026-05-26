# CMO Strategy Review

Data: 2026-05-23

## Veredito

A base da iBob esta forte para estrategia e para iniciar o proximo bloco do Decision Engine supervisionado.

Ela ainda nao deve liberar execucao automatica de Ads. O gargalo nao e mais contexto comercial; agora e tracking de qualidade, calibracao do funil e ativacao formal da versao de contexto.

## O que ja esta claro

- Oferta prioritaria: motorredutores acima de 5cv, com foco maior em motorredutores e paineis de acionamento para maquinas acima de 10cv.
- ICP: pequenos fabricantes de maquinas sob demanda que precisam de dimensionamento tecnico e quadro de comando.
- Publico ruim: pessoa fisica sem empresa, oportunistas intermediadores e demandas simples/baixa quantidade.
- Ticket medio: R$ 15.000.
- Margem bruta informada: 15%.
- Lucro bruto estimado por venda: R$ 2.250.
- CAC alvo: R$ 700.
- Verba mensal: R$ 20.000.
- Capacidade comercial: 30 leads por dia.
- Ciclo de venda: cerca de 15 dias.
- Meta de previsibilidade: 60 dias.

## Implicacao economica

Com ticket medio de R$ 15.000 e margem de 15%, cada venda gera cerca de R$ 2.250 de margem bruta. Um CAC alvo de R$ 700 deixa aproximadamente R$ 1.550 antes de overhead e custos operacionais.

Com R$ 20.000 de budget e CAC de R$ 700, o alvo teorico e cerca de 28 vendas por mes. Isso exigiria aproximadamente R$ 428 mil de receita mensal atribuida e R$ 64 mil de margem bruta antes da midia.

## O que falta antes de escalar Ads

- Medir funil real por origem: lead, lead qualificado, oportunidade, proposta e venda.
- Enviar conversoes offline/CRM para Google e Meta com qualidade de lead e venda fechada.
- Definir CPL maximo por taxa real de fechamento.
- Ativar a versao do contexto comercial e resolver lacunas antigas que ja foram cumpridas.
- Derivar regras deterministicas a partir do contexto: margem, CAC, capacidade, no-fit, janela de 15 dias e limite de risco.

## Como chegar a base 100

Na v39, a nota deixa de ser uma caixa-preta e passa a ser dividida em cinco blocos:

| Bloco | Pontos | Estado iBob |
| --- | ---: | --- |
| Contexto comercial | 30 | completo |
| Economia e restricoes | 22 | completo |
| Pesquisa e memoria | 22 | completo |
| Governanca do contexto | 12 | parcial |
| Tracking e funil real | 14 | parcial |

Para a iBob sair de 87 para 100:

- ganhar 6 pontos resolvendo ou ignorando lacunas antigas ja superadas e ativando a versao aprovada do contexto;
- ganhar 7 pontos mapeando o funil real por origem: lead qualificado, oportunidade, proposta e venda;
- depois conectar ou importar manualmente conversoes offline/CRM para que Ads otimize por qualidade real, nao apenas por lead.

Na v40, a tela `/strategy` passa a mostrar botoes de resolucao:

- `Resolver` em governanca do contexto: ativa o contexto aprovado e marca lacunas antigas conhecidas como resolvidas.
- `Ver caminho` em tracking e funil real: abre o roteiro operacional de campos e eventos que precisam existir antes das integracoes finais.

Na v41, a rota `/funnel` prepara a operacao desse segundo ponto com checklist, schema local e template CSV para importacao manual.

Na v44, `/strategy` passa a recalcular a parte de tracking/funil com base nos eventos reais registrados em `/funnel`.

Importante: base 100 nao significa execucao automatica liberada. Significa que o contexto estrategico esta pronto para o Decision Engine supervisionado gerar propostas com boa governanca.

## Guardrails iniciais

- Nao otimizar por lead barato se o lead nao for fabricante, decisor ou demanda tecnica compativel.
- Separar campanhas de compra direta de produtos padronizados e campanhas consultivas de especificacao.
- Julgar performance com janela minima alinhada ao ciclo de venda de 15 dias.
- Nao escalar acima da capacidade de 30 leads/dia.
- Bloquear automacao externa ate tracking de qualidade e venda estar operacional.

## Tracking recomendado

Para Google Ads, a direcao correta e usar Enhanced Conversions for Leads/Data Manager ou API com dados first-party e identificadores de clique quando disponiveis. A propria documentacao do Google recomenda Enhanced Conversions for Leads para melhorar mensuracao e bidding de conversoes offline.

Fontes oficiais:

- Google Ads Help: https://support.google.com/google-ads/answer/15713840
- Google Ads API offline conversions: https://developers.google.com/google-ads/api/docs/conversions/upload-offline
- Meta Business Help, Conversions API: https://www.facebook.com/business/help/AboutConversionsAPI

Observacao importante em 2026-05-23: ha comunicados recentes do ecossistema Google Ads API indicando transicao para Data Manager API para novos adotantes de offline conversions a partir de 2026-06-15. Isso deve ser validado antes de escolher a implementacao tecnica final.

## Produto

Foi criada a camada `CMO Strategy Readiness` como ponte entre Context Intelligence, Context Research e Decision Engine.

Tela prevista:

```text
/strategy
```

Ela cruza:

- respostas do diagnostico;
- memoria contextual ativa;
- concorrentes e achados revisados;
- economia de CAC/margem/budget;
- cenarios de CPL maximo;
- bloqueios antes de escala.
- decomposicao da nota e acoes para chegar a 100.
- botoes de resolucao e plano guiado para os pontos faltantes.

## Proxima etapa

Validar `/strategy` em producao. Depois, resolver/ativar o contexto e preparar o schema de regras estrategicas que o Decision Engine deve obedecer.
