import * as Sentry from '@sentry/react-native';

// Crash reporting via Sentry — only in release builds that have a DSN
// (EXPO_PUBLIC_SENTRY_DSN in .env). No personal data, no performance tracing.
export function initCrashReporting() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn || __DEV__) return;
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    enableAutoSessionTracking: true,
  });
}
