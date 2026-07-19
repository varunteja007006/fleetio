import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Platform, View } from "react-native";

type CheckpointData = {
	_id: Id<"checkpoints">;
	name: string;
	latitude: number;
	longitude: number;
	sequence: number;
};

type VisitData = {
	_id: Id<"checkpointVisits">;
	checkpointId: Id<"checkpoints">;
	status: "pending" | "completed" | "skipped";
	checkpoint?: CheckpointData | null;
};

type Props = {
	visits: VisitData[];
	driverLatitude?: number;
	driverLongitude?: number;
	routeRunId?: Id<"routeRuns">;
	showPath?: boolean;
};

export function RouteMap({
	visits,
	driverLatitude,
	driverLongitude,
	routeRunId,
	showPath,
}: Props) {
	if (Platform.OS === "web") {
		return (
			<View className="h-48 items-center justify-center rounded-xl bg-muted">
				<View className="text-muted-foreground" />
			</View>
		);
	}

	const allLocations = useQuery(
		api.driverLocations.getLocationsForRun,
		showPath && routeRunId ? { routeRunId } : "skip",
	);

	const checkpoints = visits
		.filter((v) => v.checkpoint && !v.checkpoint.isDeleted)
		.map((v) => v.checkpoint!);

	if (checkpoints.length === 0 && !driverLatitude) {
		return (
			<View className="h-48 items-center justify-center rounded-xl bg-muted">
				<View className="text-muted-foreground" />
			</View>
		);
	}

	const MapView = require("react-native-maps").default;
	const { Marker, Polyline } = require("react-native-maps");

	const initialRegion = driverLatitude
		? {
				latitude: driverLatitude,
				longitude: driverLongitude ?? 0,
				latitudeDelta: 0.05,
				longitudeDelta: 0.05,
			}
		: checkpoints.length > 0
			? {
					latitude: checkpoints[0].latitude,
					longitude: checkpoints[0].longitude,
					latitudeDelta: 0.05,
					longitudeDelta: 0.05,
				}
			: {
					latitude: 0,
					longitude: 0,
					latitudeDelta: 0.05,
					longitudeDelta: 0.05,
				};

	const pathCoords =
		showPath && allLocations
			? allLocations.map((loc) => ({
					latitude: loc.latitude,
					longitude: loc.longitude,
				}))
			: [];

	return (
		<View className="h-64 overflow-hidden rounded-xl">
			<MapView
				style={{ flex: 1 }}
				initialRegion={initialRegion}
				showsUserLocation={false}
			>
				{checkpoints.map((cp, index) => {
					const visit = visits.find(
						(v) => v.checkpointId === cp._id,
					);
					const isCompleted = visit?.status === "completed";
					const isCurrent =
						visit?.status === "pending" &&
						(index === 0 ||
							visits
								.slice(0, index)
								.every((v) => v.status === "completed"));

					return (
						<Marker
							key={cp._id}
							coordinate={{
								latitude: cp.latitude,
								longitude: cp.longitude,
							}}
							title={cp.name}
							description={`Checkpoint ${index + 1}`}
							pinColor={
								isCompleted
									? "#22c55e"
									: isCurrent
										? "#3b82f6"
										: "#9ca3af"
							}
						/>
					);
				})}

				{driverLatitude && driverLongitude ? (
					<Marker
						coordinate={{
							latitude: driverLatitude,
							longitude: driverLongitude,
						}}
						title="You are here"
						pinColor="#ef4444"
					/>
				) : null}

				{pathCoords.length > 1 ? (
					<Polyline
						coordinates={pathCoords}
						strokeColor="#3b82f6"
						strokeWidth={3}
					/>
				) : null}
			</MapView>
		</View>
	);
}
