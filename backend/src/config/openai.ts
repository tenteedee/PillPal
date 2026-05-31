import OpenAI from 'openai';

import { env } from './env.js';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  if (!env.OPENAI_API_KEY) {
    throw new Error('OpenAI is not configured. Missing OPENAI_API_KEY');
  }

  openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  return openaiClient;
}
