import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery } from "convex/react";
import { Stack } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import z from "zod";

import AdminHeader from "~/components/admin-header";
import { useAppForm } from "~/components/forms/hooks";
import { LocationPicker } from "~/components/maps/location-picker";

const createGeofenceSchema = z.object({
	name: z.string().min(1, "Geofence name is required"),
	radius: z.string().min(1, "Radius is required"),
});

export default function GeofencesAdminScreen() {
	const geofences = useQuery(api.geofences.list, {});
	const createGeofence = useMutation(api.geofences.create);
	const removeGeofence = useMutation(api.geofences.remove);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [deletingGeofenceId, setDeletingGeofenceId] = useState<
		Id<"checkpoints"> | null
	>(null);
	const [latitude, setLatitude] = useState<number | null>(null);
	const [longitude, setLongitude] = useState<number | null>(null);

	const locationSet = latitude !== null && longitude !== null;

	const form = useAppForm({
		defaultValues: {
			name: "",
			radius: "100",
		},
		validators: { onSubmit: createGeofenceSchema },
		onSubmit: async ({ value }) => {
			if (latitude === null || longitude === null) {
				return;
			}
			setIsSubmitting(true);
			try {
				const radius = parseInt(value.radius, 10);

				await createGeofence({
					name: value.name,
					latitude,
					longitude,
					radius: Number.isNaN(radius) ? 100 : radius,
				});

				form.reset();
				setLatitude(null);
				setLongitude(null);
			} catch (error) {
				Alert.alert(
					"Create geofence failed",
					error instanceof Error ? error.message : "Please try again.",
				);
			} finally {
				setIsSubmitting(false);
			}
		},
	});

	const handleDeleteGeofence = (
		geofenceId: Id<"checkpoints">,
		geofenceName: string,
	) => {
		Alert.alert(
			"Delete geofence",
			`This will permanently remove ${geofenceName} and its circular zone.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						setDeletingGeofenceId(geofenceId);
						try {
							await removeGeofence({ checkpointId: geofenceId });
						} catch (error) {
							Alert.alert(
								"Delete geofence failed",
								error instanceof Error
									? error.message
									: "Please try again.",
							);
						} finally {
							setDeletingGeofenceId(null);
						}
					},
				},
			],
		);
	};

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ headerShown: false }} />
			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<AdminHeader
					title="Geofences"
					subtitle="Circular zones with a configurable radius around a point on the map."
				/>

				<View className="bg-card border-border mt-5 rounded-xl border p-4">
					<View className="mb-4 flex-row items-center gap-2">
						<Lucide name="circle-dot" size={20} color="#3b82f6" />
						<Text className="text-foreground text-lg font-semibold">
							Create geofence
						</Text>
					</View>

					<View className="mb-3">
						<form.AppField name="name">
							{(field) => (
								<field.Input
									label="Geofence name"
									placeholder="Eg: Depot parking zone"
									autoCapitalize="words"
									editable={!isSubmitting}
								/>
							)}
						</form.AppField>
					</View>

					<View className="mb-4">
						<form.AppField name="radius">
							{(field) => (
								<field.Input
									label="Radius (meters)"
									placeholder="Eg: 100"
									keyboardType="numeric"
									editable={!isSubmitting}
								/>
							)}
						</form.AppField>
					</View>

					<LocationPicker
						latitude={latitude}
						longitude={longitude}
						onLocationChange={(lat, lng) => {
							setLatitude(lat);
							setLongitude(lng);
						}}
					/>

					{!locationSet && (
						<Text className="text-muted-foreground mt-2 text-sm">
							Pick a location on the map
						</Text>
					)}

					<Pressable
						onPress={async () => form.handleSubmit()}
						disabled={isSubmitting || !locationSet}
						className={`bg-primary mt-4 rounded-lg py-3 ${
							isSubmitting || !locationSet ? "opacity-60" : "active:opacity-80"
						}`}
					>
						{isSubmitting ? (
							<ActivityIndicator color="#ffffff" />
						) : (
							<Text className="text-primary-foreground text-center font-semibold">
								Create geofence
							</Text>
						)}
					</Pressable>
				</View>

				<View className="mt-6 gap-3">
					<Text className="text-foreground text-lg font-semibold">
						Existing geofences
					</Text>
					{geofences === undefined ? (
						<ActivityIndicator />
					) : geofences.length === 0 ? (
						<Text className="text-muted-foreground text-sm">
							No geofences yet. Add your first zone using the form above.
						</Text>
					) : (
						geofences.map((geofence) => (
							<View
								key={geofence._id}
								className="bg-card border-border rounded-xl border p-4"
							>
								<Text className="text-foreground text-base font-semibold">
									{geofence.name}
								</Text>
								<View className="mt-1 flex-row items-center gap-2">
									<Lucide name="map-pin" size={14} color="#9ca3af" />
									<Text className="text-muted-foreground font-mono text-sm">
										{geofence.latitude.toFixed(6)},{" "}
										{geofence.longitude.toFixed(6)}
									</Text>
								</View>

								<View className="mt-3 flex-row items-center justify-between">
									<View className="bg-muted rounded-full px-3 py-1">
										<Text className="text-muted-foreground text-xs font-medium">
											{geofence.radius}m
										</Text>
									</View>
									<Pressable
										onPress={() =>
											handleDeleteGeofence(geofence._id, geofence.name)
										}
										disabled={deletingGeofenceId === geofence._id}
										className={`rounded-lg px-4 py-2 ${
											deletingGeofenceId === geofence._id
												? "bg-destructive/70"
												: "bg-destructive active:opacity-80"
										}`}
									>
										<Text className="text-destructive-foreground font-medium">
											{deletingGeofenceId === geofence._id
												? "Deleting..."
												: "Delete"}
										</Text>
									</Pressable>
								</View>
							</View>
						))
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
