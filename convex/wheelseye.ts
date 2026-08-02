export type VehicleFix = {
	latitude: number;
	longitude: number;
	speed: number;
	heading: number;
	timestamp: number;
};

const WHEELSEYE_BASE_URL = "https://api.wheelseye.com";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findVehicleObject(value: unknown): Record<string, unknown> | null {
	if (isRecord(value)) {
		if (
			typeof value.latitude === "number" &&
			typeof value.longitude === "number"
		) {
			return value;
		}
		for (const key of Object.keys(value)) {
			const found = findVehicleObject(value[key]);
			if (found !== null) {
				return found;
			}
		}
	}
	if (Array.isArray(value)) {
		for (const item of value) {
			const found = findVehicleObject(item);
			if (found !== null) {
				return found;
			}
		}
	}
	return null;
}

export async function fetchVehicleLocation(
	accessToken: string,
	externalVehicleId?: string,
): Promise<VehicleFix> {
	let url = `${WHEELSEYE_BASE_URL}/vehicle/location`;
	if (externalVehicleId !== undefined) {
		url += `?externalId=${encodeURIComponent(externalVehicleId)}`;
	}
	const res = await fetch(url, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
	});
	if (!res.ok) {
		throw new Error(`WheelsEye request failed: ${res.status}`);
	}
	const body: unknown = await res.json();
	const vehicle = findVehicleObject(body);
	if (vehicle === null) {
		throw new Error("WheelsEye response contained no vehicle location");
	}
	if (
		typeof vehicle.latitude !== "number" ||
		!Number.isFinite(vehicle.latitude) ||
		typeof vehicle.longitude !== "number" ||
		!Number.isFinite(vehicle.longitude)
	) {
		throw new Error("WheelsEye response missing valid latitude/longitude");
	}
	const speed =
		typeof vehicle.speed === "number" && Number.isFinite(vehicle.speed)
			? vehicle.speed
			: 0;
	const heading =
		typeof vehicle.heading === "number" && Number.isFinite(vehicle.heading)
			? vehicle.heading
			: 0;
	const timestamp =
		typeof vehicle.timestamp === "number" &&
		Number.isFinite(vehicle.timestamp)
			? vehicle.timestamp
			: Date.now();
	return {
		latitude: vehicle.latitude,
		longitude: vehicle.longitude,
		speed,
		heading,
		timestamp,
	};
}
