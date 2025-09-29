export function registerTelemetry() {
  // Only enable OpenTelemetry in non-Vercel environments to avoid dependency issues
  if (!process.env.VERCEL && !process.env.NEXT_RUNTIME) {
    try {
      const { register } = require('@lobechat/observability-otel/node');
      const { version } = require('../package.json');

      register({ version });
    } catch (error: any) {
      console.warn('OpenTelemetry initialization failed:', error?.message || error);
    }
  }
}

// Auto-register when module is imported
registerTelemetry();
