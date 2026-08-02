import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Stack } from "expo-router";
import { ActivityIndicator, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LocatedVehicle = {
	vehicle: Doc<"vehicles">;
	location: Doc<"currentLocations"> | null;
};

const DOT_COLORS: Record<string, string> = {
	entered: "bg-green-500",
	exited: "bg-red-500",
	crossed: "bg-violet-500",
};

function getRelativeTime(timestamp: number) {
	const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
	if (minutes === 0) return "just now";
	return `${minutes}m ago`;
}

function LiveFleetMap({
	vehicleLocations,
	geofences,
}: {
	vehicleLocations: LocatedVehicle[];
	geofences: Doc<"checkpoints">[];
}) {
	const MapView = require("react-native-maps").default;
	const { Marker, Circle } = require("react-native-maps");

	const located = vehicleLocations.flatMap((item) =>
		item.location ? [{ vehicle: item.vehicle, location: item.location }] : [],
	);

	const first = located[0];

	const initialRegion = first
		? {
				latitude: first.location.latitude,
				longitude: first.location.longitude,
				latitudeDelta: 0.05,
				longitudeDelta: 0.05,
			}
		: {
				latitude: 20.5937,
				longitude: 78.9629,
				latitudeDelta: 0.05,
				longitudeDelta: 0.05,
			};

	return (
		<View className="h-72 overflow-hidden rounded-xl">
			<MapView
				style={{ flex: 1 }}
				initialRegion={initialRegion}
				showsUserLocation={false}
			>
				{located.map(({ vehicle, location }) => (
					<Marker
						key={vehicle._id}
						coordinate={{
							latitude: location.latitude,
							longitude: location.longitude,
						}}
						title={vehicle.name}
						description={`${Math.round(location.speed)} km/h · ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
						pinColor="#3b82f6"
					/>
				))}

				{geofences.map((geofence) =>
					Circle ? (
						<Circle
							key={geofence._id}
							center={{
								latitude: geofence.latitude,
								longitude: geofence.longitude,
							}}
							radius={geofence.radius ?? 100}
							strokeColor="#8b5cf6"
							fillColor="rgba(139,92,246,0.15)"
						/>
					) : null,
				)}
			</MapView>
		</View>
	);
}

export default function FleetScreen() {
	const vehicleLocations = useQuery(api.vehicles.listWithCurrentLocations);
	const vehicles = useQuery(api.vehicles.list);
	const geofences = useQuery(api.geofences.list);
	const recentEvents = useQuery(api.events.listRecent, {
		paginationOpts: { numItems: 20, cursor: null },
	});

	const vehicleNameMap: Record<string, string> = {};
	for (const vehicle of vehicles ?? []) {
		vehicleNameMap[vehicle._id] = vehicle.registrationNumber;
	}

	const geofenceNameMap: Record<string, string> = {};
	for (const geofence of geofences ?? []) {
		geofenceNameMap[geofence._id] = geofence.name;
	}

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ headerShown: false }} />
			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text className="text-foreground text-2xl font-bold">Fleet</Text>
				<Text className="text-muted-foreground mt-1 text-sm">
					Live vehicle positions and geofence activity.
				</Text>

				<View className="mt-6">
					{vehicleLocations === undefined ? (
						<View className="h-72 items-center justify-center rounded-xl bg-muted">
							<ActivityIndicator />
						</View>
					) : Platform.OS === "web" ? (
						<View className="h-48 items-center justify-center rounded-xl bg-muted">
							<Text className="text-muted-foreground text-sm">
								Map not available on web
							</Text>
						</View>
					) : (
						<LiveFleetMap
							vehicleLocations={vehicleLocations}
							geofences={geofences ?? []}
						/>
					)}
				</View>

				<Text className="text-foreground mt-8 mb-4 text-lg font-semibold">
					Recent events
				</Text>

				{recentEvents === undefined ||
				vehicles === undefined ||
				geofences === undefined ? (
					<View className="items-center justify-center rounded-2xl border border-dashed border-border bg-card py-12">
						<ActivityIndicator />
					</View>
				) : recentEvents.page.length === 0 ? (
					<View className="items-center rounded-2xl border border-dashed border-border bg-card px-6 py-12">
						<Text className="text-foreground text-base font-semibold">
							No events yet
						</Text>
						<Text className="text-muted-foreground mt-1 text-center text-sm">
							Geofence activity will show up here.
						</Text>
					</View>
				) : (
					<View className="bg-card rounded-2xl border border-border px-5">
						{recentEvents.page.map((event) => (
							<View
								key={event._id}
								className="flex-row items-center gap-3 border-b border-border py-3.5 last:border-b-0"
							>
								<View
									className={`h-2.5 w-2.5 rounded-full ${
										DOT_COLORS[event.type] ?? "bg-muted"
									}`}
								/>
								<Text className="text-foreground flex-1 text-sm font-medium">
									{vehicleNameMap[event.vehicleId] ?? "Unknown vehicle"}{" "}
									{event.type}{" "}
									{geofenceNameMap[event.checkpointId] ?? "Unknown geofence"}
								</Text>
								<Text className="text-muted-foreground text-xs">
									{getRelativeTime(event.createdAt)}
								</Text>
							</View>
						))}
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
