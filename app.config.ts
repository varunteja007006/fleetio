import type { ExpoConfig } from "expo/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appJson = JSON.parse(
	readFileSync(resolve(__dirname, "app.json"), "utf-8"),
);

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const config: ExpoConfig = {
	...appJson.expo,
	ios: {
		...appJson.expo.ios,
		bundleIdentifier: "com.fleetio.app",
	},
	android: {
		...appJson.expo.android,
		config: googleMapsApiKey
			? {
					googleMaps: {
						apiKey: googleMapsApiKey,
					},
				}
			: undefined,
	},
};

export default config;
