/**
 * Factory that returns the configured LLM provider.
 * Reads from environment variables so provider selection is configuration-driven.
 *
 * Supported providers:
 *   LLM_PROVIDER=openai   → OpenAI (requires OPENAI_API_KEY)
 *   LLM_PROVIDER=mock     → Mock provider (default, no API key needed)
 *
 * Adding a new provider: implement BaseLLMProvider, add a case here.
 */

import type { LLMProvider } from '@flowpilot/shared';
import { OpenAIProvider } from './openai-provider.js';
import { MockLLMProvider } from './mock-provider.js';

export function createLLMProvider(overrides?: {
  provider?: string;
  apiKey?: string;
  model?: string;
}): LLMProvider {
  const providerName =
    overrides?.provider ??
    process.env['LLM_PROVIDER'] ??
    'mock';

  switch (providerName.toLowerCase()) {
    case 'openai': {
      const apiKey = overrides?.apiKey ?? process.env['OPENAI_API_KEY'];
      if (!apiKey) {
        throw new Error(
          'OPENAI_API_KEY environment variable is required when LLM_PROVIDER=openai'
        );
      }
      return new OpenAIProvider({
        apiKey,
        model: overrides?.model ?? process.env['OPENAI_MODEL'],
      });
    }

    case 'mock':
    default:
      return new MockLLMProvider();
  }
}
