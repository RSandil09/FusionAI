import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// S3Client must be mocked as a real class (arrow functions cannot be `new`-ed).
const mockSend = vi.fn().mockResolvedValue({});

vi.mock("@aws-sdk/client-s3", () => {
	class S3Client {
		send = mockSend;
	}
	class PutObjectCommand {
		constructor(public input: unknown) {}
	}
	class DeleteObjectCommand {
		constructor(public input: unknown) {}
	}
	return { S3Client, PutObjectCommand, DeleteObjectCommand };
});

const R2_ENV = {
	R2_ACCESS_KEY_ID: "test-key",
	R2_SECRET_ACCESS_KEY: "test-secret",
	R2_ENDPOINT: "https://r2.test.example.com",
	R2_BUCKET_NAME: "test-bucket",
	R2_PUBLIC_URL: "https://pub.test.example.com",
};

beforeEach(() => {
	for (const [k, v] of Object.entries(R2_ENV)) vi.stubEnv(k, v);
	vi.resetModules();
	mockSend.mockResolvedValue({});
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.resetModules();
});

describe("getR2Client", () => {
	it("returns a client when credentials are present", async () => {
		const { getR2Client } = await import("./r2");
		const client = getR2Client();
		expect(client).toBeDefined();
		expect(typeof client.send).toBe("function");
	});

	it("throws when credentials are missing", async () => {
		vi.stubEnv("R2_ACCESS_KEY_ID", "");
		vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
		vi.stubEnv("R2_ENDPOINT", "");
		const { getR2Client } = await import("./r2");
		expect(() => getR2Client()).toThrow("R2 credentials missing");
	});
});

describe("uploadToR2", () => {
	it("returns the public URL after a successful upload", async () => {
		const { uploadToR2 } = await import("./r2");
		const url = await uploadToR2(
			"users/abc/file.mp4",
			Buffer.from("data"),
			"video/mp4",
		);
		expect(url).toBe("https://pub.test.example.com/users/abc/file.mp4");
	});

	it("throws when bucket env vars are missing", async () => {
		vi.stubEnv("R2_BUCKET_NAME", "");
		vi.stubEnv("R2_PUBLIC_URL", "");
		const { uploadToR2 } = await import("./r2");
		await expect(
			uploadToR2("key", Buffer.from("x"), "image/png"),
		).rejects.toThrow("R2_BUCKET_NAME");
	});
});

describe("generateUploadKey", () => {
	it("produces the expected path format", async () => {
		const { generateUploadKey } = await import("./r2");
		const key = generateUploadKey("user123", "my file.mp4");
		expect(key).toMatch(/^users\/user123\/uploads\/\d+-my_file\.mp4$/);
	});

	it("replaces spaces and special characters with underscores", async () => {
		const { generateUploadKey } = await import("./r2");
		const key = generateUploadKey("u1", "héllo wörld!.png");
		// Spaces and non-ASCII chars must be replaced; only [a-zA-Z0-9.-] survive
		expect(key).not.toMatch(/[ !éö]/);
		expect(key).toMatch(/\.png$/);
	});
});
