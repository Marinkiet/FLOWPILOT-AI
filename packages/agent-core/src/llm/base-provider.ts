/**
 * Base LLM provider — all providers extend this.
 * The abstraction means you can swap OpenAI for Anthropic, Ollama, etc.
 * without touching any agent logic.
 */

import type { LLMProvider, LLMMessage, LLMResponse, LLMOptions } from '@flowpilot/shared';

export abstract class BaseLLMProvider implements LLMProvider {
  abstract readonly name: string;

  abstract chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;

  /** Default: stream not supported — subclasses can override */
  async *stream(messages: LLMMessage[], options?: LLMOptions): AsyncIterable<string> {
    const response = await this.chat(messages, options);
    yield response.content;
  }

  /** Helper: build a system + user message pair */
  protected buildMessages(system: string, user: string): LLMMessage[] {
    return [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];
  }

  /** Helper: parse JSON from LLM output, handling markdown code fences */
  protected parseJSON<T>(text: string): T {
    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    return JSON.parse(cleaned) as T;
  }
}
