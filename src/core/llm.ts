import fetch from 'node-fetch';

export interface LLMEnv {
    apiKey: string;
    baseUrl?: string;
    model: string;
  }

  export interface LLMMessage {
    role: 'system' | 'user';
    content: string;
  }

  export type ResponseFormat = 'text' | 'json_object';

  interface CallLlmOptions {
    responseFormat?: ResponseFormat;
  }

  // Generic: can return string or typed JSON depending on responseFormat & type parameter T.
  export async function callLLM<T = string>(
    env: LLMEnv,
    messages: LLMMessage[],
    options?: CallLlmOptions,
  ): Promise<T> {
    const baseUrl = env.baseUrl ?? 'https://api.openai.com/v1';

    const body: any = {
      model: env.model,
      messages,
      temperature: 0,
    };

    // Ask OpenAI for structured JSON output
    if (options?.responseFormat === 'json_object') {
      body.response_format = { type: 'json_object' };
    }

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`LLM error: ${resp.status} ${text}`);
    }

    const json = await resp.json() as {
      choices?: { message?: { content?: string } }[];
    };

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('LLM returned no content');
    }

    // text mode: just return the content as-is
    if (!options || options.responseFormat === 'text' || !options.responseFormat) {
      return content as T;
    }

    // json_object mode: parse JSON from the content
    if (options.responseFormat === 'json_object') {
      try {
        return JSON.parse(content) as T;
      } catch (err) {
        console.error('Failed to parse JSON from LLM content:');
        console.error(content);
        throw err;
      }
    }

    // fallback (should not hit)
    return content as T;
  }
