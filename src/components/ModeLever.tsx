import React from "react";
import { Laptop, User } from "lucide-react";

import { useDevice } from "../utils/useDevice";

interface ModeLeverProps {
	/** Current mode of the application */
	mode: "work" | "personal";
	/** Callback function when mode is toggled */
	onToggle: (newMode: "work" | "personal") => void;
}

export const ModeLever: React.FC<ModeLeverProps> = ({ mode, onToggle }) => {
	const handleClick = () => {
		onToggle(mode === "work" ? "personal" : "work");
	};

	const { isMobile } = useDevice();

	return (
		<div
			className={`absolute ${isMobile ? "bottom" : "top"}-4 left-4 z-10`}
		>
			<div className="bg-blue-500 rounded-lg p-1.5 shadow-lg">
				{/* Icons and Track */}
				<div className="relative flex flex-col items-center">
					{/* Work Mode Icon */}
					<div
						className={`p-0.5 mb-0.5 rounded-full ${
							mode === "work" ? "text-white" : "text-blue-200"
						}`}
					>
						<Laptop size={14} />
					</div>

					{/* Lever Track */}
					<div
						className="relative w-3 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer"
						onClick={handleClick}
					>
						{/* Track Groove */}
						<div className="absolute w-0.5 h-full bg-blue-700 rounded-full" />

						{/* Sliding Ball */}
						<div
							className={`absolute w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg transition-all duration-300 ease-in-out 
                ${mode === "work" ? "top-0.5" : "bottom-0.5"}`}
						/>
					</div>

					{/* Personal Mode Icon */}
					<div
						className={`p-0.5 mt-0.5 rounded-full ${
							mode === "personal" ? "text-white" : "text-blue-200"
						}`}
					>
						<User size={14} />
					</div>
				</div>
			</div>
		</div>
	);
};

export default ModeLever;
