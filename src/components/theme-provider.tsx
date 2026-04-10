"use client";

/**
 * Theme Provider
 *
 * Manages dark / light / system theme across the whole app.
 *
 * - Applies "dark" class to <html> (matches the @custom-variant dark rule in globals.css)
 * - Persists selection to localStorage so it survives page refresh before the
 *   user's DB settings have loaded (prevents flash of wrong theme)
 * - "system" mode follows prefers-color-scheme and updates live when the OS
 *   setting changes
 * - Exposes useTheme() hook for reading + setting the theme from any component
 */

import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
	/** The stored preference: "light" | "dark" | "system" */
	theme: Theme;
	/** The resolved class that is actually applied to <html> right now */
	resolvedTheme: "light" | "dark";
	/** Update theme preference — applies immediately and persists to localStorage */
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
	theme: "dark",
	resolvedTheme: "dark",
	setTheme: () => {},
});

export function useTheme() {
	return useContext(ThemeContext);
}

const STORAGE_KEY = "fusion-theme";

function getSystemTheme(): "light" | "dark" {
	if (typeof window === "undefined") return "dark";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function applyTheme(theme: Theme) {
	const resolved = theme === "system" ? getSystemTheme() : theme;
	const root = document.documentElement;
	if (resolved === "dark") {
		root.classList.add("dark");
	} else {
		root.classList.remove("dark");
	}
	return resolved;
}

function readStorage(): Theme {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === "light" || stored === "dark" || stored === "system") {
			return stored;
		}
	} catch {}
	return "dark"; // default
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>("dark");
	const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

	// On mount: read localStorage and apply immediately
	useEffect(() => {
		const stored = readStorage();
		setThemeState(stored);
		const resolved = applyTheme(stored);
		setResolvedTheme(resolved);
	}, []);

	// Track system preference changes (only relevant when theme === "system")
	useEffect(() => {
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => {
			setThemeState((current) => {
				if (current === "system") {
					const resolved = applyTheme("system");
					setResolvedTheme(resolved);
				}
				return current;
			});
		};
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	const setTheme = useCallback((next: Theme) => {
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {}
		setThemeState(next);
		const resolved = applyTheme(next);
		setResolvedTheme(resolved);
	}, []);

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

/**
 * Sync a theme value fetched from the server (user settings API) into the
 * ThemeProvider without losing the localStorage-first fast path.
 *
 * Call this once after the user's settings have been loaded from the API.
 */
export function useApplyRemoteTheme() {
	const { setTheme } = useTheme();
	return useCallback(
		(remoteTheme: string | null | undefined) => {
			if (
				remoteTheme === "light" ||
				remoteTheme === "dark" ||
				remoteTheme === "system"
			) {
				setTheme(remoteTheme);
			}
		},
		[setTheme],
	);
}
