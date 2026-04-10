import { Player } from "../player";
import { useRef, useImperativeHandle, forwardRef, useState, useEffect, useCallback } from "react";
import useStore from "../store/use-store";
import StateManager from "@designcombo/state";
import SceneEmpty from "./empty";
import Board from "./board";
import useZoom from "../hooks/use-zoom";
import { SceneInteractions } from "./interactions";
import { SceneRef } from "./scene.types";
import { Maximize2, Minimize2 } from "lucide-react";

const Scene = forwardRef<
	SceneRef,
	{
		stateManager: StateManager;
	}
>(({ stateManager }, ref) => {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const { size, trackItemIds } = useStore();
	const { zoom, handlePinch, recalculateZoom } = useZoom(
		containerRef as React.RefObject<HTMLDivElement>,
		size,
	);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [showControls, setShowControls] = useState(false);

	// Expose the recalculateZoom function to parent
	useImperativeHandle(ref, () => ({
		recalculateZoom,
	}));

	// Sync state with browser fullscreen events
	useEffect(() => {
		const onFsChange = () => {
			const fsEl = document.fullscreenElement;
			setIsFullscreen(fsEl === wrapperRef.current);
			// Give the browser time to resize before recalculating zoom
			setTimeout(() => recalculateZoom(), 150);
		};
		document.addEventListener("fullscreenchange", onFsChange);
		return () => document.removeEventListener("fullscreenchange", onFsChange);
	}, [recalculateZoom]);

	const toggleFullscreen = useCallback(async () => {
		if (!document.fullscreenElement) {
			await wrapperRef.current?.requestFullscreen();
		} else {
			await document.exitFullscreen();
		}
	}, []);

	// F key shortcut (only when not typing in an input)
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const tag = (e.target as HTMLElement)?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
			if (e.key === "f" || e.key === "F") toggleFullscreen();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [toggleFullscreen]);

	return (
		<div
			ref={wrapperRef}
			onMouseEnter={() => setShowControls(true)}
			onMouseLeave={() => setShowControls(false)}
			style={{
				width: "100%",
				height: "100%",
				position: "relative",
				flex: 1,
				overflow: "hidden",
				background: isFullscreen ? "#111" : "transparent",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			{/* Fullscreen toggle button */}
			<button
				onClick={toggleFullscreen}
				title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
				style={{
					position: "absolute",
					bottom: 12,
					right: 12,
					zIndex: 200,
					opacity: showControls || isFullscreen ? 1 : 0,
					transition: "opacity 0.15s",
					pointerEvents: "auto",
				}}
				className="flex items-center justify-center h-8 w-8 rounded-lg bg-black/60 border border-white/15 hover:bg-black/80 hover:border-white/30 backdrop-blur-sm text-white"
			>
				{isFullscreen ? (
					<Minimize2 className="h-3.5 w-3.5" />
				) : (
					<Maximize2 className="h-3.5 w-3.5" />
				)}
			</button>

			<div
				style={{
					width: "100%",
					height: "100%",
					position: "relative",
					flex: 1,
					overflow: "hidden",
					background: "transparent",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				}}
				ref={containerRef}
			>
				{trackItemIds.length === 0 && <SceneEmpty />}
				<div
					style={{
						width: size.width,
						height: size.height,
						background: "#000000",
						transform: `scale(${zoom})`,
						position: "absolute",
					}}
					className="player-container bg-sidebar"
				>
					<div
						style={{
							position: "absolute",
							zIndex: 100,
							pointerEvents: "none",
							width: size.width,
							height: size.height,
							background: "transparent",
							boxShadow: "0 0 0 5000px #111",
						}}
					/>
					<Board size={size}>
						<Player />
						<SceneInteractions
							stateManager={stateManager}
							containerRef={containerRef as React.RefObject<HTMLDivElement>}
							zoom={zoom}
							size={size}
						/>
					</Board>
				</div>
			</div>
		</div>
	);
});

Scene.displayName = "Scene";

export default Scene;
