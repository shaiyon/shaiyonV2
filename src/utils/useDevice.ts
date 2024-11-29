// utils/useDevice.ts
import { useMemo } from "react";

export const useDevice = () => {
	const isMobile = useMemo(() => {
		const userAgent = window.navigator.userAgent.toLowerCase();
		const mobileKeywords = [
			"iphone",
			"ipad",
			"ipod",
			"android",
			"mobile",
			"phone",
			"tablet",
		];
		return mobileKeywords.some((keyword) => userAgent.includes(keyword));
	}, []);

	return { isMobile };
};
