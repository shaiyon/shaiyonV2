import { createContext, useContext, ReactNode } from "react";

interface PauseContextType {
	isPaused: boolean;
}

export const PauseContext = createContext<PauseContextType | undefined>(
	undefined
);

export const PauseProvider = ({
	children,
	isPaused,
}: {
	children: ReactNode;
	isPaused: boolean;
}) => {
	return (
		<PauseContext.Provider value={{ isPaused }}>
			{children}
		</PauseContext.Provider>
	);
};

export const usePauseContext = () => {
	const context = useContext(PauseContext);
	if (!context) {
		throw new Error("usePauseContext must be used within a PauseProvider");
	}
	return context;
};
