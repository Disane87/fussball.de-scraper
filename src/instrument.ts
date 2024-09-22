import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: 'https://4d5d694ad1c64a55af871e17e1c03d93@monitoring.disane.dev/1',
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],
  environment: process.env.NODE_ENV,

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
