import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Create session cookie API endpoint
 * Called after Firebase client-side login to create a server-side session
 * Rate limited to prevent brute-force attacks.
 */
export async function POST(request: Request) {
	// Rate limit: 30 attempts per minute per IP
	const ip = getClientIp(request);
	const rl = await checkRateLimit(`auth-session:${ip}`, 30, 60_000);
	if (!rl.success) {
		return NextResponse.json(
			{ message: "Too many login attempts. Try again later." },
			{ status: 429, headers: { "Retry-After": String(rl.resetIn) } },
		);
	}

	try {
		logger.log("🔵 /api/auth/session POST request received");

		const { idToken } = await request.json();

		if (!idToken) {
			logger.error("❌ No idToken provided");
			return NextResponse.json(
				{ message: "ID token is required" },
				{ status: 400 },
			);
		}

		// Verify the ID token first
		const decodedToken = await adminAuth.verifyIdToken(idToken);
		logger.log("✅ ID token verified for user:", decodedToken.uid);

		// Set session expiration to 14 days (in milliseconds)
		const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days

		// Create the session cookie
		const sessionCookie = await adminAuth.createSessionCookie(idToken, {
			expiresIn,
		});

		logger.log("✅ Session cookie created");

		// Set the cookie
		const cookieStore = await cookies();
		cookieStore.set("session", sessionCookie, {
			maxAge: expiresIn / 1000, // Convert to seconds
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
		});

		logger.log("✅ Session cookie set in response");

		return NextResponse.json(
			{
				success: true,
				message: "Session created successfully",
				uid: decodedToken.uid,
			},
			{ status: 200 },
		);
	} catch (error) {
		logger.error("❌ Session creation error:", error);
		return NextResponse.json(
			{
				message: "Failed to create session",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

/**
 * Delete session cookie (logout)
 */
export async function DELETE() {
	try {
		logger.log("🔵 /api/auth/session DELETE request received");

		const cookieStore = await cookies();
		cookieStore.delete("session");

		logger.log("✅ Session cookie deleted");

		return NextResponse.json(
			{ success: true, message: "Session deleted" },
			{ status: 200 },
		);
	} catch (error) {
		logger.error("❌ Session deletion error:", error);
		return NextResponse.json(
			{
				message: "Failed to delete session",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
