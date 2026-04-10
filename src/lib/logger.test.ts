import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("logger", () => {
	let consoleSpy: {
		log: ReturnType<typeof vi.spyOn>;
		debug: ReturnType<typeof vi.spyOn>;
		warn: ReturnType<typeof vi.spyOn>;
		error: ReturnType<typeof vi.spyOn>;
	};

	beforeEach(() => {
		consoleSpy = {
			log: vi.spyOn(console, "log").mockImplementation(() => {}),
			debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
			warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
			error: vi.spyOn(console, "error").mockImplementation(() => {}),
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
	});

	describe("in development (NODE_ENV=development)", () => {
		it("passes log through to console.log", async () => {
			vi.stubEnv("NODE_ENV", "development");
			const { logger } = await import("./logger");
			logger.log("hello");
			expect(consoleSpy.log).toHaveBeenCalledWith("hello");
		});

		it("passes debug through to console.debug", async () => {
			vi.stubEnv("NODE_ENV", "development");
			const { logger } = await import("./logger");
			logger.debug("debug msg");
			expect(consoleSpy.debug).toHaveBeenCalledWith("debug msg");
		});

		it("passes warn through to console.warn", async () => {
			vi.stubEnv("NODE_ENV", "development");
			const { logger } = await import("./logger");
			logger.warn("watch out");
			expect(consoleSpy.warn).toHaveBeenCalled();
		});

		it("passes error through to console.error", async () => {
			vi.stubEnv("NODE_ENV", "development");
			const { logger } = await import("./logger");
			logger.error("oh no");
			expect(consoleSpy.error).toHaveBeenCalled();
		});
	});

	describe("in production (NODE_ENV=production)", () => {
		it("silences logger.log", async () => {
			vi.stubEnv("NODE_ENV", "production");
			const { logger } = await import("./logger");
			logger.log("should be silent");
			expect(consoleSpy.log).not.toHaveBeenCalled();
		});

		it("silences logger.debug", async () => {
			vi.stubEnv("NODE_ENV", "production");
			const { logger } = await import("./logger");
			logger.debug("should be silent");
			expect(consoleSpy.debug).not.toHaveBeenCalled();
		});

		it("still emits logger.warn in production", async () => {
			vi.stubEnv("NODE_ENV", "production");
			const { logger } = await import("./logger");
			logger.warn("important warning");
			expect(consoleSpy.warn).toHaveBeenCalled();
		});

		it("still emits logger.error in production", async () => {
			vi.stubEnv("NODE_ENV", "production");
			const { logger } = await import("./logger");
			logger.error("critical error");
			expect(consoleSpy.error).toHaveBeenCalled();
		});
	});
});
