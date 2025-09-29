export async function register() {
  // Only enable telemetry in nodejs runtime, when explicitly enabled, and not in Vercel environment
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.ENABLE_TELEMETRY &&
    !process.env.VERCEL
  ) {
    await import('./instrumentation.node');
  }
}
