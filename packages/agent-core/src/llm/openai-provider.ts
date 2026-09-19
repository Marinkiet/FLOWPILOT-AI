/**
 * OpenAI LLM provider implementation.
 * Uses the REST API directly (no SDK dependency) so this stays lightweight
 * and the abstraction layer remains clean.
 */

import { BaseLLMProvider } from './base-provider.js';
import type { LLMMessage, LLMResponse, LLMOptions } from '@flowpilot/shared';

interface OpenAIConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

interface OpenAIChoice {
  message: { content: string };
  finish_reason: string;
}

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
  usage?: OpenAIUsage;
}

export class OpenAIProvider extends BaseLLMProvider {
  readonly name = 'openai';
  private readonly config: Required<OpenAIConfig>;

  constructor(config: OpenAIConfig) {
    super();
    this.config = {
      apiKey: config.apiKey,
      model: config.model ?? 'gpt-4o',
      baseUrl: config.baseUrl ?? 'https://api.openai.com/v1',
    };
  }

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const body = {
      model: options?.model ?? this.config.model,
      messages,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 4096,
    };

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    const choice = data.choices[0];
    if (!choice) throw new Error('OpenAI returned no choices');

    return {
      content: choice.message.content,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      raw: data,
    };
  }
}
