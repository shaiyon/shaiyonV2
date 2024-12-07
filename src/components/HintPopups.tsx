// TO RESET IN BROWSER CONSOLE FOR TESTING:
// localStorage.removeItem('has-seen-grab-hint')
// localStorage.removeItem('has-seen-lever-hint')

import { useState, useEffect } from "react";
import { useDevice } from "../utils/useDevice";

// Animation timing constants
const CONSTANTS = {
	GRAB_POPUP_DELAY: 5000,
	LEVER_POPUP_DELAY: 40000,
	POPUP_DURATION: 5000,
	FADE_DURATION: 2000, // 300ms for fade in/out
};

const STORAGE_KEYS = {
	GRAB: "has-seen-grab-hint",
	LEVER: "has-seen-lever-hint",
};

const TextPopup = ({ text, show, position }) => {
	const [opacity, setOpacity] = useState(0);

	useEffect(() => {
		if (show) {
			setOpacity(1);
			const timeout = setTimeout(() => {
				setOpacity(0);
			}, CONSTANTS.POPUP_DURATION);

			return () => clearTimeout(timeout);
		}
	}, [show]);

	return (
		<div
			className={`fixed top-5 left-1/2 -translate-x-1/2 transition-opacity duration-300 z-20`}
			style={{ opacity }}
		>
			<div className=" text-black px-4 py-2 font-helvetica text-m whitespace-nowrap">
				{text}
			</div>
		</div>
	);
};

export const HintPopups = () => {
	const { isMobile } = useDevice();
	const [showGrabPopup, setShowGrabPopup] = useState(false);
	const [showLeverPopup, setShowLeverPopup] = useState(false);
	const [shouldShowGrabHint, setShouldShowGrabHint] = useState(false);
	const [shouldShowLeverHint, setShouldShowLeverHint] = useState(false);

	useEffect(() => {
		// Check each hint separately
		const hasSeenGrabHint = localStorage.getItem(STORAGE_KEYS.GRAB);
		const hasSeenLeverHint = localStorage.getItem(STORAGE_KEYS.LEVER);

		if (!hasSeenGrabHint) {
			setShouldShowGrabHint(true);
		}
		if (!hasSeenLeverHint) {
			setShouldShowLeverHint(true);
		}
	}, []);

	useEffect(() => {
		if (!shouldShowGrabHint) return;

		// Show grab popup after delay
		const grabTimeout = setTimeout(() => {
			setShowGrabPopup(true);

			setTimeout(() => {
				setShowGrabPopup(false);
				// Mark grab hint as seen after it's shown
				localStorage.setItem(STORAGE_KEYS.GRAB, "true");
			}, CONSTANTS.POPUP_DURATION + CONSTANTS.FADE_DURATION);
		}, CONSTANTS.GRAB_POPUP_DELAY);

		return () => clearTimeout(grabTimeout);
	}, [shouldShowGrabHint]);

	useEffect(() => {
		if (!shouldShowLeverHint) return;

		// Show lever popup after delay
		const leverTimeout = setTimeout(() => {
			setShowLeverPopup(true);

			setTimeout(() => {
				setShowLeverPopup(false);
				// Mark lever hint as seen after it's shown
				localStorage.setItem(STORAGE_KEYS.LEVER, "true");
			}, CONSTANTS.POPUP_DURATION + CONSTANTS.FADE_DURATION);
		}, CONSTANTS.LEVER_POPUP_DELAY);

		return () => clearTimeout(leverTimeout);
	}, [shouldShowLeverHint]);

	// If user has seen both hints, don't render anything
	if (!shouldShowGrabHint && !shouldShowLeverHint) {
		return null;
	}

	const grabText = `${isMobile ? "Tap" : "Click"} and hold to grab objects`;
	const leverText = "Pull the lever!";

	return (
		<>
			<TextPopup
				text={grabText}
				show={showGrabPopup}
				position="top-center"
			/>
			<TextPopup
				text={leverText}
				show={showLeverPopup}
				position="top-center"
			/>
		</>
	);
};

export default HintPopups;
