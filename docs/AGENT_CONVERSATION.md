# Conversar com o Agente

Data: 2026-06-02
Versao: v55

## Objetivo

Adicionar um ponto de conversa consultiva com o agente para perguntas de gestao de vendas e marketing.

Exemplo:

```text
Estamos recebendo leads desqualificados. O que podemos fazer?
```

## Entrega v55

Foi criada a rota:

```text
/agent
```

A tela permite perguntar ao agente sobre:

- qualidade de leads;
- CAC;
- vendas;
- escala de Ads;
- funil;
- prioridades comerciais;
- bloqueios antes de crescer investimento.

## Como responde

Nesta versao, o agente responde em modo supervisionado e deterministico, usando:

- contexto comercial;
- pesquisa e memoria contextual;
- nota CMO;
- eventos de funil;
- lacunas abertas;
- regras ja validadas do nucleo supervisionado.

## O que ainda nao faz

A v55 nao:

- chama LLM externo;
- chama Google Ads;
- chama Meta Ads;
- chama MCP;
- persiste historico da conversa no banco;
- cria proposta automaticamente a partir da conversa.

## Proxima evolucao

Depois da validacao da tela, a evolucao natural e:

- persistir conversas por cliente;
- transformar uma resposta em hipotese do Decision Engine;
- gerar proposta supervisionada a partir da conversa;
- somente depois avaliar LLM externo com guardrails.
