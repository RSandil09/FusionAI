import { describe, it, expect } from "vitest";
import { checkRateLimit, getClientIp } from "./rate-limit";

// Tests run without Upstash env vars → exercises the in-memory fallback.
describe("rate-limit", () => {
	describe("checkRateLimit (in-memory fallback)", () => {
		it("allows first request", async () => {
			const result = await checkRateLimit("key1", 5, 60_000);
			expect(result.success).toBe(true);
			expect(result.remaining).toBe(4);
		});

		it("tracks multiple requests", async () => {
			await checkRateLimit("key2", 3, 60_000);
			await checkRateLimit("key2", 3, 60_000);
			const result = await checkRateLimit("key2", 3, 60_000);
			expect(result.success).toBe(true);
			expect(result.remaining).toBe(0);
		});

		it("rejects when limit exceeded", async () => {
			for (let i = 0; i < 3; i++) {
				await checkRateLimit("key3", 2, 60_000);
			}
			const result = await checkRateLimit("key3", 2, 60_000);
			expect(result.success).toBe(false);
			expect(result.remaining).toBe(0);
		});

		it("uses separate keys", async () => {
			await checkRateLimit("user-a", 1, 60_000);
			const resultB = await checkRateLimit("user-b", 1, 60_000);
			expect(resultB.success).toBe(true);
		});

		it("returns resetIn as a number in seconds", async () => {
			const result = await checkRateLimit("key-reset", 5, 30_000);
			expect(typeof result.resetIn).toBe("number");
			expect(result.resetIn).toBeGreaterThanOrEqual(0);
		});
	});

	describe("getClientIp", () => {
		it("reads x-forwarded-for", () => {
			const req = new Request("http://localhost", {
				headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
			});
			expect(getClientIp(req)).toBe("1.2.3.4");
		});

		it("reads x-real-ip", () => {
			const req = new Request("http://localhost", {
				headers: { "x-real-ip": "9.9.9.9" },
			});
			expect(getClientIp(req)).toBe("9.9.9.9");
		});

		it("returns unknown when no headers", () => {
			const req = new Request("http://localhost");
			expect(getClientIp(req)).toBe("unknown");
		});
	});
});
