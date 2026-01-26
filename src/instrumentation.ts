export async function register() {
  // Only enable telemetry in nodejs runtime, when explicitly enabled, and not in Vercel environment
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Load localStorage shim early to prevent SSR errors from Next.js dev overlay
    await import('./utils/localStorageShim');

    if (process.env.ENABLE_TELEMETRY && !process.env.VERCEL) {
      await import('./instrumentation.node');
    }
  }
}
