import { createContext, useContext, useState, FC, ReactNode } from "react";

interface CameraContextType {
	isEnabled: boolean;
	setIsEnabled: (enabled: boolean) => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const [isEnabled, setIsEnabled] = useState(true);

	return (
		<CameraContext.Provider value={{ isEnabled, setIsEnabled }}>
			{children}
		</CameraContext.Provider>
	);
};

export const useCameraContext = () => {
	const context = useContext(CameraContext);
	if (!context) {
		throw new Error(
			"useCameraContext must be used within a CameraProvider"
		);
	}
	return context;
};
