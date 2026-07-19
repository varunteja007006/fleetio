import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

type LocationStatus = "idle" | "requesting" | "tracking" | "error" | "unavailable";

export function useLocationTracking(routeRunId: Id<"routeRuns"> | null) {
	const [status, setStatus] = useState<LocationStatus>("idle");
	const [lastLocation, setLastLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const recordLocation = useMutation(api.driverLocations.recordLocation);

	useEffect(() => {
		if (!routeRunId) {
			setStatus("idle");
			return;
		}

		if (Platform.OS === "web") {
			setStatus("unavailable");
			return;
		}

		let mounted = true;

		const startTracking = async () => {
			try {
				setStatus("requesting");

				const { Location } = await import("expo-location");

				const { status: permStatus } =
					await Location.requestForegroundPermissionsAsync();

				if (!mounted) return;

				if (permStatus !== "granted") {
					setStatus("error");
					setError("Location permission denied");
					return;
				}

				setStatus("tracking");

				const sendLocation = async () => {
					try {
						const pos = await Location.getCurrentPositionAsync({
							accuracy: Location.Accuracy.High,
						});

						if (!mounted) return;

						const { latitude, longitude } = pos.coords;
						setLastLocation({ latitude, longitude });

						await recordLocation({
							routeRunId,
							latitude,
							longitude,
							speed: pos.coords.speed ?? undefined,
							heading: pos.coords.heading ?? undefined,
						});
					} catch {
						// Silently retry on next interval
					}
				};

				await sendLocation();

				intervalRef.current = setInterval(sendLocation, 30000);
			} catch (err) {
				if (!mounted) return;
				setStatus("error");
				setError(
					err instanceof Error ? err.message : "Failed to start location tracking",
				);
			}
		};

		startTracking();

		return () => {
			mounted = false;
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [routeRunId, recordLocation]);

	return { status, lastLocation, error };
}
