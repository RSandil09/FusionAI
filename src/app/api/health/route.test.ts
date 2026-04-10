import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/env", () => ({
	isServerEnvValid: vi.fn(),
}));

afterEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
});

describe("GET /api/health", () => {
	it("returns 200 with status:ok when env is valid", async () => {
		const { isServerEnvValid } = await import("@/lib/env");
		vi.mocked(isServerEnvValid).mockReturnValue(true);

		const { GET } = await import("./route");
		const response = await GET();
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.status).toBe("ok");
		expect(body.env).toBe("valid");
		expect(typeof body.timestamp).toBe("string");
	});

	it("returns 503 with status:degraded when env is invalid", async () => {
		const { isServerEnvValid } = await import("@/lib/env");
		vi.mocked(isServerEnvValid).mockReturnValue(false);

		const { GET } = await import("./route");
		const response = await GET();
		const body = await response.json();

		expect(response.status).toBe(503);
		expect(body.status).toBe("degraded");
		expect(body.env).toBe("invalid");
	});

	it("includes a valid ISO timestamp", async () => {
		const { isServerEnvValid } = await import("@/lib/env");
		vi.mocked(isServerEnvValid).mockReturnValue(true);

		const { GET } = await import("./route");
		const response = await GET();
		const body = await response.json();

		expect(() => new Date(body.timestamp)).not.toThrow();
		expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
	});
});
