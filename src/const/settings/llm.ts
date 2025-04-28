/*
 * @Author: flootof 2932951035@qq.com
 * @Date: 2025-04-17 17:25:52
 * @LastEditors: flootof 2932951035@qq.com
 * @LastEditTime: 2025-04-21 12:06:32
 * @FilePath: /diggo-chat-fork/src/const/settings/llm.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ModelProvider } from '@/libs/agent-runtime';
import { genUserLLMConfig } from '@/utils/genUserLLMConfig';

export const DEFAULT_LLM_CONFIG = genUserLLMConfig({
  lmstudio: {
    fetchOnClient: true,
  },
  ollama: {
    enabled: true,
    fetchOnClient: true,
  },
  openai: {
    enabled: true,
  },
});

export const DEFAULT_MODEL = 'gemini-2.0-flash-exp';

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
export const DEFAULT_EMBEDDING_PROVIDER = ModelProvider.OpenAI;

export const DEFAULT_RERANK_MODEL = 'rerank-english-v3.0';
export const DEFAULT_RERANK_PROVIDER = 'cohere';
export const DEFAULT_RERANK_QUERY_MODE = 'full_text';

export const DEFAULT_PROVIDER = ModelProvider.OpenAI;
