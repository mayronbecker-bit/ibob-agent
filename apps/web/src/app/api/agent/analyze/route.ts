import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEFAULT_MODEL = 'gpt-5.4-mini';
const MAX_QUESTION_LENGTH = 2_000;
const MAX_CONTEXT_CHARS = 18_000;

type AgentAnalyzeRequest = {
  question?: unknown;
  context?: unknown;
};

type OpenAIErrorBody = {
  error?: {
    message?: unknown;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Falha inesperada ao consultar a IA externa.';
}

function compactJson(value: unknown) {
  const json = JSON.stringify(value ?? {}, null, 2);

  if (json.length <= MAX_CONTEXT_CHARS) {
    return json;
  }

  return `${json.slice(0, MAX_CONTEXT_CHARS)}\n... contexto truncado para proteger custo e latencia ...`;
}

function extractOpenAIText(payload: unknown) {
  if (!isRecord(payload)) {
    return '';
  }

  if (typeof payload.output_text === 'string') {
    return payload.output_text.trim();
  }

  const output = payload.output;
  if (!Array.isArray(output)) {
    return '';
  }

  return output
    .flatMap((item) => {
      if (!isRecord(item)) {
        return [];
      }

      const content = item.content;
      if (typeof content === 'string') {
        return [content];
      }

      if (!Array.isArray(content)) {
        return [];
      }

      return content.flatMap((part) => {
        if (!isRecord(part)) {
          return [];
        }

        if (typeof part.text === 'string') {
          return [part.text];
        }

        if (typeof part.refusal === 'string') {
          return [part.refusal];
        }

        return [];
      });
    })
    .join('\n')
    .trim();
}

function buildInstructions() {
  return [
    'Voce e o agente CMO estrategico da plataforma iBob Agent.',
    'Responda sempre em portugues do Brasil, com clareza executiva e foco em vendas, marketing, CRM, funil, CAC, margem e previsibilidade.',
    'Use somente o contexto enviado pela aplicacao. Nao invente numeros, credenciais, dados de campanha ou fatos externos.',
    'Se faltar dado, explique exatamente qual dado falta e como o usuario deve registrar isso na plataforma.',
    'Priorize vender mais com menor custo de Ads, melhor qualificacao de leads e maior previsibilidade comercial.',
    'Nao execute acoes em Google Ads, Meta Ads, CRM ou MCP. MCPs e integracoes externas ficam bloqueados nesta fase.',
    'Quando a pergunta envolver mudanca operacional, indique o caminho supervisionado: Contexto -> Estrategia -> Funil -> Decision Engine -> Rule Validator -> Aprovacao -> Execution dry-run.',
    'Formato esperado: Diagnostico, Prioridades, Acoes recomendadas, Evidencias usadas, Riscos e Proximo passo dentro da plataforma.',
  ].join('\n');
}

function buildInput(question: string, context: unknown) {
  return [
    'Pergunta do usuario:',
    question,
    '',
    'Snapshot operacional da plataforma:',
    compactJson(context),
  ].join('\n');
}

function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const enabled = process.env.OPENAI_ANALYSIS_ENABLED?.toLowerCase() !== 'false';
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  return {
    apiKey,
    enabled,
    model,
  };
}

export async function GET() {
  const config = getOpenAIConfig();

  return NextResponse.json({
    mode: 'openai_status',
    enabled: config.enabled,
    configured: Boolean(config.apiKey),
    model: config.model,
    fallbackAvailable: true,
  });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as AgentAnalyzeRequest | null;
  const question = typeof payload?.question === 'string' ? payload.question.trim() : '';

  if (!question) {
    return NextResponse.json(
      { error: 'Pergunta obrigatoria.', fallback: true },
      { status: 400 },
    );
  }

  const config = getOpenAIConfig();

  if (!config.enabled) {
    return NextResponse.json(
      { error: 'Analise externa desativada por ambiente.', fallback: true },
      { status: 503 },
    );
  }

  if (!config.apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY nao configurada.', fallback: true },
      { status: 503 },
    );
  }

  const safeQuestion = question.slice(0, MAX_QUESTION_LENGTH);

  try {
    const openAIResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        instructions: buildInstructions(),
        input: buildInput(safeQuestion, payload?.context),
        max_output_tokens: 1_200,
        store: false,
      }),
    });

    const responsePayload = (await openAIResponse.json().catch(() => ({}))) as unknown;

    if (!openAIResponse.ok) {
      const errorBody = responsePayload as OpenAIErrorBody;
      const message =
        typeof errorBody.error?.message === 'string'
          ? errorBody.error.message
          : 'A API OpenAI retornou erro.';

      return NextResponse.json({ error: message, fallback: true }, { status: 502 });
    }

    const content = extractOpenAIText(responsePayload);

    if (!content) {
      return NextResponse.json(
        { error: 'A IA externa nao retornou texto analisavel.', fallback: true },
        { status: 502 },
      );
    }

    return NextResponse.json({
      mode: 'openai',
      model: config.model,
      content,
    });
  } catch (error) {
    return NextResponse.json(
      { error: normalizeError(error), fallback: true },
      { status: 502 },
    );
  }
}
