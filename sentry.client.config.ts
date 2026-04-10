import * as Sentry from "@sentry/nextjs";

// Only initialize when DSN is provided — app works fine without it.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
	Sentry.init({
		dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
		environment: process.env.NODE_ENV,

		// Capture 10% of sessions as replays (performance tracing).
		// Set to 1.0 during debugging, then lower for production.
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,

		// Capture 10% of transactions for performance monitoring.
		tracesSampleRate: 0.1,

		integrations: [
			Sentry.replayIntegration({
				maskAllText: true,
				blockAllMedia: true,
			}),
		],
	});
}
