import { Lucide } from "@react-native-vector-icons/lucide";
import { Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Linking,
	Platform,
	Pressable,
	RefreshControl,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminHeader from "~/components/admin-header";

const WHEELSEYE_API =
	"https://api.wheelseye.com/currentLoc?accessToken=a06235f1-d851-41e9-9f30-54ce278b2a6f";

type VehicleLocation = {
	vehicleNumber: string;
	deviceNumber: string;
	vendorCode: string;
	venndorName?: string;
	latitude: number;
	longitude: number;
	speed: number;
	vehicleType?: string;
	ignition?: boolean;
	dttime?: string;
	dttimeInEpoch?: number;
};

type ApiResponse = {
	success: boolean;
	message?: string;
	data?: { list?: VehicleLocation[] };
};

const VENDOR_COLORS = [
	"#3b82f6",
	"#f59e0b",
	"#22c55e",
	"#a855f7",
	"#ef4444",
	"#06b6d4",
];

function getRelativeTime(epoch: number | undefined) {
	if (!epoch) return "—";
	const minutes = Math.max(0, Math.floor((Date.now() / 1000 - epoch) / 60));
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.floor(hours / 24)}d ago`;
}

export default function LiveLocationsScreen() {
	const [groups, setGroups] = useState<Record<string, VehicleLocation[]>>({});
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (silent = false) => {
		if (!silent) setLoading(true);
		try {
			const res = await fetch(WHEELSEYE_API);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json: ApiResponse = await res.json();
			if (!json.success) throw new Error(json.message ?? "Bad response");

			const list = json.data?.list ?? [];
			const grouped: Record<string, VehicleLocation[]> = {};
			for (const vehicle of list) {
				const key = vehicle.venndorName || vehicle.vendorCode || "Unknown";
				(grouped[key] = grouped[key] || []).push(vehicle);
			}
			setGroups(grouped);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load locations");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const vendorNames = Object.keys(groups).sort();
	const totalVehicles = vendorNames.reduce((sum, n) => sum + groups[n].length, 0);

	const vendors = vendorNames.map((name, i) => ({
		name,
		color: VENDOR_COLORS[i % VENDOR_COLORS.length],
	}));

	return (
		<SafeAreaView className="flex-1 bg-background">
			<Stack.Screen options={{ headerShown: false }} />
			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={() => {
							setRefreshing(true);
							load(true);
						}}
					/>
				}
			>
				<AdminHeader
					title="Live Locations"
					subtitle="Vehicle positions grouped by vendor (Wheelseye)."
					right={
						<Pressable
							onPress={() => load()}
							disabled={loading}
							className="bg-primary rounded-lg px-4 py-2 active:opacity-70"
						>
							{loading ? (
								<ActivityIndicator color="#ffffff" />
							) : (
								<View className="flex-row items-center gap-1">
									<Lucide name="refresh-cw" size={16} color="#ffffff" />
									<Text className="text-primary-foreground text-sm font-semibold">
										Refresh
									</Text>
								</View>
							)}
						</Pressable>
					}
				/>

				{loading ? (
					<View className="mt-10 items-center justify-center py-16">
						<ActivityIndicator size="large" />
						<Text className="text-muted-foreground mt-3 text-sm">
							Fetching locations…
						</Text>
					</View>
				) : error ? (
					<View className="mt-10 items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 px-6">
						<Lucide name="alert-triangle" size={28} color="#dc2626" />
						<Text className="text-foreground mt-3 text-base font-semibold">
							Failed to load locations
						</Text>
						<Text className="text-muted-foreground mt-1 text-center text-sm">
							{error}
						</Text>
					</View>
				) : vendorNames.length === 0 ? (
					<View className="mt-10 items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 px-6">
						<Text className="text-foreground text-base font-semibold">
							No vehicle data returned
						</Text>
						<Text className="text-muted-foreground mt-1 text-center text-sm">
							The API returned no vehicles.
						</Text>
					</View>
				) : (
					<View className="mt-4 gap-4">
						{Platform.OS === "web" ? (
							<View className="h-48 items-center justify-center rounded-2xl bg-muted">
								<Text className="text-muted-foreground text-sm">
									Map not available on web
								</Text>
							</View>
						) : (
							<LiveMap groups={groups} vendors={vendors} />
						)}

						<Text className="text-muted-foreground text-sm">
							{totalVehicles} vehicles ·{" "}
							{new Date().toLocaleTimeString()}
						</Text>
						{vendorNames.map((name) => (
							<View key={name}>
								<View className="bg-primary flex-row items-center justify-between rounded-t-xl px-4 py-3">
									<Text className="text-primary-foreground text-base font-semibold">
										{name}
									</Text>
									<Text className="text-primary-foreground/70 text-xs font-medium">
										{groups[name].length} vehicles
									</Text>
								</View>
								<View className="bg-card border-border rounded-b-xl border border-t-0 px-4">
									{groups[name].map((vehicle) => (
										<VehicleRow key={vehicle.vehicleNumber} vehicle={vehicle} />
									))}
								</View>
							</View>
						))}
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

function VehicleRow({ vehicle }: { vehicle: VehicleLocation }) {
	const openMaps = () => {
		const url = `https://www.google.com/maps?q=${vehicle.latitude},${vehicle.longitude}`;
		Linking.openURL(url).catch(() => {});
	};

	return (
		<View className="border-border flex-row items-center border-b py-3 last:border-b-0">
			<View className="flex-1 pr-2">
				<Text className="text-foreground text-sm font-semibold">
					{vehicle.vehicleNumber}
				</Text>
				<Text className="text-muted-foreground text-xs">
					{vehicle.vehicleType ? `${vehicle.vehicleType} · ` : ""}
					{vehicle.latitude.toFixed(5)}, {vehicle.longitude.toFixed(5)}
				</Text>
				<View className="mt-1 flex-row items-center gap-2">
					<Text className="text-muted-foreground text-xs">
						{Math.round(vehicle.speed)} km/h ·{" "}
						{getRelativeTime(vehicle.dttimeInEpoch)}
					</Text>
					{vehicle.ignition ? (
						<View className="rounded-full bg-emerald-500/15 px-2 py-0.5">
							<Text className="text-emerald-600 text-[10px] font-semibold">
								IGN ON
							</Text>
						</View>
					) : (
						<View className="rounded-full bg-rose-500/15 px-2 py-0.5">
							<Text className="text-rose-600 text-[10px] font-semibold">
								IGN OFF
							</Text>
						</View>
					)}
				</View>
			</View>
			<Pressable
				onPress={openMaps}
				className="bg-secondary rounded-lg px-3 py-2 active:opacity-70"
			>
				<View className="flex-row items-center gap-1">
					<Lucide name="map" size={14} color="#94a3b8" />
					<Text className="text-secondary-foreground text-xs font-medium">
						Map
					</Text>
				</View>
			</Pressable>
		</View>
	);
}

function LiveMap({
	groups,
	vendors,
}: {
	groups: Record<string, VehicleLocation[]>;
	vendors: { name: string; color: string }[];
}) {
	const MapView = require("react-native-maps").default;
	const { Marker } = require("react-native-maps");

	const first = vendors.flatMap((v) => groups[v.name] ?? [])[0];

	const initialRegion = first
		? {
				latitude: first.latitude,
				longitude: first.longitude,
				latitudeDelta: 0.5,
				longitudeDelta: 0.5,
			}
		: {
				latitude: 20.5937,
				longitude: 78.9629,
				latitudeDelta: 8,
				longitudeDelta: 8,
			};

	return (
		<View>
			<View className="h-72 overflow-hidden rounded-2xl">
				<MapView
					style={{ flex: 1 }}
					initialRegion={initialRegion}
					showsUserLocation={false}
				>
					{vendors.map((vendor) =>
						(groups[vendor.name] ?? []).map((vehicle) => (
							<Marker
								key={vehicle.vehicleNumber}
								coordinate={{
									latitude: vehicle.latitude,
									longitude: vehicle.longitude,
								}}
								title={vehicle.vehicleNumber}
								description={`${vehicle.vehicleType ?? ""} · ${Math.round(
									vehicle.speed,
								)} km/h · ${vendor.name}`}
								pinColor={vendor.color}
							/>
						)),
					)}
				</MapView>
			</View>

			<View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
				{vendors.map((vendor) => (
					<View key={vendor.name} className="flex-row items-center gap-1.5">
						<View
							className="h-2.5 w-2.5 rounded-full"
							style={{ backgroundColor: vendor.color }}
						/>
						<Text className="text-muted-foreground text-xs">
							{vendor.name}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}