import { ServiceError } from './ors';
import { devLog } from './logger';

export type AiTextBlock = { type: 'text'; text: string };
export type AiToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
};
export type AiToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};
export type AiBlock = AiTextBlock | AiToolUseBlock | AiToolResultBlock;

export type AiMessage = {
  role: 'user' | 'assistant';
  content: string | AiBlock[];
};

export type AiTool = {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
};

export type AiResponse = {
  content: AiBlock[];
  stop_reason: string | null;
};

export const AI_ERROR_MESSAGES = {
  noKey: 'The assistant is not set up. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to .env and restart the app.',
  network: 'No internet connection. Check your connection and try again.',
  quota: 'The assistant is busy right now. Please try again in a moment.',
  failed: 'The assistant ran into a problem. Please try again.',
} as const;

// Point EXPO_PUBLIC_AI_BASE_URL at your own backend proxy for production. A key that ships inside
// the app bundle can be extracted, so the proxy should hold the real key and rate-limit users.
const AI_BASE_URL = (process.env.EXPO_PUBLIC_AI_BASE_URL?.trim() || 'https://api.anthropic.com').replace(
  /\/+$/,
  '',
);
const AI_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY?.trim() ?? '';
const AI_MODEL = process.env.EXPO_PUBLIC_AI_MODEL?.trim() || 'claude-haiku-5-5';
const USES_PROXY = Boolean(process.env.EXPO_PUBLIC_AI_BASE_URL?.trim());

const MAX_TOKENS = 1024;
const ANTHROPIC_VERSION = '2023-06-01';

type Request = {
  system: string;
  messages: AiMessage[];
  tools: AiTool[];
  signal?: AbortSignal;
};

export async function createMessage({ system, messages, tools, signal }: Request): Promise<AiResponse> {
  if (!AI_API_KEY && !USES_PROXY) {
    devLog('POST /v1/messages: EXPO_PUBLIC_ANTHROPIC_API_KEY is empty');
    throw new ServiceError('noKey', AI_ERROR_MESSAGES.noKey);
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'anthropic-version': ANTHROPIC_VERSION,
    // Required for direct calls from a browser, which is what the web build does.
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  if (AI_API_KEY) headers['x-api-key'] = AI_API_KEY;

  let response: Response;
  try {
    response = await fetch(`${AI_BASE_URL}/v1/messages`, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({ model: AI_MODEL, max_tokens: MAX_TOKENS, system, messages, tools }),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    devLog('POST /v1/messages: network error');
    throw new ServiceError('network', AI_ERROR_MESSAGES.network);
  }

  devLog(`POST /v1/messages: ${response.status}`);
  if (response.status === 401 || response.status === 403) {
    throw new ServiceError('noKey', AI_ERROR_MESSAGES.noKey);
  }
  if (response.status === 429 || response.status === 529) {
    throw new ServiceError('quota', AI_ERROR_MESSAGES.quota);
  }
  if (!response.ok) {
    throw new ServiceError('failed', AI_ERROR_MESSAGES.failed);
  }

  const data = (await response.json()) as Partial<AiResponse>;
  return { content: Array.isArray(data.content) ? data.content : [], stop_reason: data.stop_reason ?? null };
}
