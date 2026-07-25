import { v } from "convex/values";

import { action } from "./_generated/server";

export const search = action({
	args: {
		query: v.string(),
	},
	handler: async (_, args) => {
		const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(args.query)}&format=json&limit=5&accept-language=en`;
		const res = await fetch(url, {
			headers: { "User-Agent": "Fleetio/1.0" },
		});
		const data = await res.json();
		return data as Array<{
			lat: string;
			lon: string;
			display_name: string;
		}>;
	},
});

export const reverse = action({
	args: {
		latitude: v.number(),
		longitude: v.number(),
	},
	handler: async (_, args) => {
		const url = `https://nominatim.openstreetmap.org/reverse?lat=${args.latitude}&lon=${args.longitude}&format=json&accept-language=en`;
		const res = await fetch(url, {
			headers: { "User-Agent": "Fleetio/1.0" },
		});
		const data = await res.json();
		if (data && data.display_name) {
			return data as { display_name: string };
		}
		return null;
	},
});
