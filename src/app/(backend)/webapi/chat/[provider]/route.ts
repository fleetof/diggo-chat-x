import {
  AGENT_RUNTIME_ERROR_SET,
  ChatCompletionErrorPayload,
  ChatStreamPayload,
  ModelRuntime,
} from '@lobechat/model-runtime';
import { ChatErrorType } from '@lobechat/types';

import { checkAuth } from '@/app/(backend)/middleware/auth';
import { createTraceOptions, initModelRuntimeWithUserPayload } from '@/server/modules/ModelRuntime';
import { createErrorResponse } from '@/utils/errorResponse';
import { getTracePayload } from '@/utils/trace';

export const maxDuration = 60;

// Restricted models that should be blocked
const RESTRICTED_MODELS = new Set(['claude-opus-4-20250514']);

export const POST = checkAuth(async (req: Request, { params, jwtPayload, createRuntime }) => {
  const { provider } = await params;

  try {
    // ============  1. init chat model   ============ //
    let modelRuntime: ModelRuntime;
    if (createRuntime) {
      modelRuntime = createRuntime(jwtPayload);
    } else {
      modelRuntime = await initModelRuntimeWithUserPayload(provider, jwtPayload);
    }

    // ============  2. create chat completion   ============ //

    const data = (await req.json()) as ChatStreamPayload;

    // ============  3. check for restricted models  ============ //
    if (RESTRICTED_MODELS.has(data.model)) {
      console.warn(`Restricted model access attempt: ${data.model} by user ${jwtPayload.userId}`);
      throw {
        error: `模型 "${data.model}" 暂时禁止使用，请联系管理员获取更多信息。如果您认为这是错误，请提供此错误码：RESTRICTED_MODEL_${data.model.toUpperCase().replaceAll(/[^\dA-Z]/g, '_')}`,
        errorType: ChatErrorType.Forbidden,
        provider,
      };
    }

    const tracePayload = getTracePayload(req);

    let traceOptions = {};
    // If user enable trace
    if (tracePayload?.enabled) {
      traceOptions = createTraceOptions(data, { provider, trace: tracePayload });
    }

    return await modelRuntime.chat(data, {
      user: jwtPayload.userId,
      ...traceOptions,
      signal: req.signal,
    });
  } catch (e) {
    const {
      errorType = ChatErrorType.InternalServerError,
      error: errorContent,
      ...res
    } = e as ChatCompletionErrorPayload;

    const error = errorContent || e;

    const logMethod = AGENT_RUNTIME_ERROR_SET.has(errorType as string) ? 'warn' : 'error';
    // track the error at server side
    console[logMethod](`Route: [${provider}] ${errorType}:`, error);

    return createErrorResponse(errorType, { error, ...res, provider });
  }
});
