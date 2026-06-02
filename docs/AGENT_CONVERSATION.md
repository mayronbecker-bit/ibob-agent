# Conversar com o Agente

Data: 2026-06-02
Versao: v56

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

## Entrega v56

A rota `/agent` agora tenta usar IA externa pela OpenAI / ChatGPT API para analise estrategica, mantendo o nucleo supervisionado local como fallback.

Foi criada a rota server-side:

```text
/api/agent/analyze
```

Caracteristicas:

- a chave `OPENAI_API_KEY` fica somente no servidor;
- o browser nao recebe nem exibe a chave;
- o modelo pode ser trocado por `OPENAI_MODEL`;
- se a chave faltar, a API falhar ou a analise externa for desativada, o agente responde pelo fallback supervisionado local;
- MCPs, Google Ads, Meta Ads, CRM e qualquer escrita externa continuam bloqueados.

## Como responde

O agente responde usando:

- contexto comercial;
- pesquisa e memoria contextual;
- nota CMO;
- eventos de funil;
- lacunas abertas;
- regras ja validadas do nucleo supervisionado.
- IA externa quando `OPENAI_API_KEY` estiver configurada no servidor.

Mesmo quando usa IA externa, o agente nao executa acoes. Ele apenas orienta o caminho supervisionado:

```text
Contexto -> Estrategia -> Funil -> Decision Engine -> Rule Validator -> Aprovacao -> Execution dry-run
```

## Variaveis

Configurar localmente em `.env.local` e em producao na Hostinger:

```text
OPENAI_API_KEY=<chave da OpenAI>
OPENAI_MODEL=gpt-5.4-mini
OPENAI_ANALYSIS_ENABLED=true
```

`gpt-5.4-mini` fica como padrao de custo/latencia. Para analises mais profundas, pode ser trocado por `gpt-5.5` no ambiente.

## O que ainda nao faz

A v56 nao:

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
- deixar MCPs de Google Ads, Meta Ads e CRM por ultimo, como conectores supervisionados.
