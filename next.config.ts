import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
	reactStrictMode: false,
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},
				],
			},
		];
	},
	serverExternalPackages: [
		"@remotion/bundler",
		"@remotion/renderer",
		"esbuild",
		"sharp",
	],
	webpack: (config, { isServer }) => {
		// Disable HMR for @designcombo packages that have incompatible HMR code
		if (!isServer) {
			config.module = config.module || {};
			config.module.rules = config.module.rules || [];

			config.module.rules.push({
				test: /node_modules\/@designcombo\/(timeline|state|events|animations|transitions)/,
				parser: {
					javascript: {
						importMeta: false,
					},
				},
			});
		}
		return config;
	},
};

export default withSentryConfig(nextConfig, {
	// Suppress Sentry CLI output during builds unless DSN is set.
	silent: !process.env.NEXT_PUBLIC_SENTRY_DSN,

	// Tree-shake Sentry debug code from production bundles.
	disableLogger: true,

	// Automatically instrument Next.js data fetching methods.
	autoInstrumentServerFunctions: true,
});
