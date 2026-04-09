export const calculateFrames = (
	display: { from: number; to: number },
	fps: number,
) => {
	// Remotion requires integer frames — round to avoid float precision issues
	const from = Math.round(((display.from ?? 0) / 1000) * fps);
	const to = Math.round(((display.to ?? 0) / 1000) * fps);
	const durationInFrames = Math.max(1, to - from);
	return { from, durationInFrames };
};
