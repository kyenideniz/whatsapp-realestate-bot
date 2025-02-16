// lib/monitoring.js
/*import * as Sentry from '@sentry/nextjs';

export function initMonitoring() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        ...(process.env.TURBOPACK
          ? []
          : [new Sentry.Integrations.Prisma()] // Example conditional integration
    )]
    });
  }
}*/