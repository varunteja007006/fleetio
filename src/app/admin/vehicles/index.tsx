import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Stack, useRouter, type Href } from "expo-router";
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

const createVehicleSchema = z.object({
	name: z.string().min(1, "Vehicle name is required"),
	registrationNumber: z.string().min(1, "Registration number is required"),
	make: z.string(),
	model: z.string(),
});

export default function VehicleAdminListScreen() {
	const router = useRouter();
	const vehicles = useQuery(api.vehicles.list, {});
	const createVehicle = useMutation(api.vehicles.create);
	const deactivateVehicle = useMutation(api.vehicles.deactivate);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [deactivatingVehicleId, setDeactivatingVehicleId] = useState<
		Id<"vehicles"> | null
	>(null);

	const form = useAppForm({
		defaultValues: {
			name: "",
			registrationNumber: "",
			make: "",
			model: "",
		},
		validators: { onSubmit: createVehicleSchema },
		onSubmit: async ({ value }) => {
			setIsSubmitting(true);
			try {
				const make = value.make.trim();
				const model = value.model.trim();

				await createVehicle({
					name: value.name,
					registrationNumber: value.registrationNumber,
					make: make ? make : undefined,
					model: model ? model : undefined,
				});

				form.reset();
			} catch (error) {
				Alert.alert(
					"Create vehicle failed",
					error instanceof Error ? error.message : "Please try again.",
				);
			} finally {
				setIsSubmitting(false);
			}
		},
	});

	const handleDeactivateVehicle = (vehicleId: Id<"vehicles">, vehicleName: string) => {
		Alert.alert(
			"Deactivate vehicle",
			`This will deactivate ${vehicleName}. It will no longer show as active in the fleet.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Deactivate",
					style: "destructive",
					onPress: async () => {
						setDeactivatingVehicleId(vehicleId);
						try {
							await deactivateVehicle({ vehicleId });
						} catch (error) {
							Alert.alert(
								"Deactivate vehicle failed",
								error instanceof Error ? error.message : "Please try again.",
							);
						} finally {
							setDeactivatingVehicleId(null);
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
					title="Vehicles"
					subtitle="Create, configure, and deactivate vehicles in your fleet."
				/>

				<View className="bg-card border-border mt-5 rounded-xl border p-4">
					<Text className="text-foreground mb-4 text-lg font-semibold">
						Create vehicle
					</Text>
					<View className="mb-3">
						<form.AppField name="name">
							{(field) => (
								<field.Input
									label="Vehicle name"
									placeholder="Eg: Bus 01"
									autoCapitalize="words"
									editable={!isSubmitting}
								/>
							)}
						</form.AppField>
					</View>
					<View className="mb-3">
						<form.AppField name="registrationNumber">
							{(field) => (
								<field.Input
									label="Registration number"
									placeholder="Eg: KA-01-AB-1234"
									autoCapitalize="characters"
									editable={!isSubmitting}
								/>
							)}
						</form.AppField>
					</View>
					<View className="mb-3">
						<form.AppField name="make">
							{(field) => (
								<field.Input
									label="Make"
									placeholder="Optional"
									autoCapitalize="words"
									editable={!isSubmitting}
								/>
							)}
						</form.AppField>
					</View>
					<form.AppField name="model">
						{(field) => (
							<field.Input
								label="Model"
								placeholder="Optional"
								autoCapitalize="words"
								editable={!isSubmitting}
							/>
						)}
					</form.AppField>

					<Pressable
						onPress={async () => form.handleSubmit()}
						disabled={isSubmitting}
						className={`bg-primary mt-4 rounded-lg py-3 ${
							isSubmitting ? "opacity-60" : "active:opacity-80"
						}`}
					>
						{isSubmitting ? (
							<ActivityIndicator color="#ffffff" />
						) : (
							<Text className="text-primary-foreground text-center font-semibold">
								Create vehicle
							</Text>
						)}
					</Pressable>
				</View>

				<View className="mt-6 gap-3">
					<Text className="text-foreground text-lg font-semibold">
						Existing vehicles
					</Text>
					{vehicles === undefined ? (
						<ActivityIndicator />
					) : vehicles.length === 0 ? (
						<Text className="text-muted-foreground text-sm">
							No vehicles yet. Add your first vehicle using the form above.
						</Text>
					) : (
						vehicles.map((vehicle) => (
							<View
								key={vehicle._id}
								className="bg-card border-border rounded-xl border p-4"
							>
								<View className="flex-row items-center justify-between">
									<Text className="text-foreground flex-1 pr-3 text-base font-semibold">
										{vehicle.name}
									</Text>
									<View
										className={`rounded-full px-2.5 py-1 ${
											vehicle.isActive
												? "bg-emerald-500/15"
												: "bg-muted"
										}`}
									>
										<Text
											className={`text-xs font-semibold ${
												vehicle.isActive
													? "text-emerald-600"
													: "text-muted-foreground"
											}`}
										>
											{vehicle.isActive ? "Active" : "Inactive"}
										</Text>
									</View>
								</View>
								<Text className="text-muted-foreground mt-1 text-sm">
									{vehicle.registrationNumber}
								</Text>
								{vehicle.make || vehicle.model ? (
									<Text className="text-muted-foreground mt-1 text-sm">
										{[vehicle.make, vehicle.model].filter(Boolean).join(" ")}
									</Text>
								) : null}

								<View className="mt-4 flex-row gap-3">
									<Pressable
										onPress={() =>
											router.push(
												`/admin/vehicles/${vehicle._id}` as Href,
											)
										}
										className="bg-secondary rounded-lg px-4 py-2 active:opacity-80"
									>
										<Text className="text-secondary-foreground font-medium">
											Configure
										</Text>
									</Pressable>
									{vehicle.isActive ? (
										<Pressable
											onPress={() =>
												handleDeactivateVehicle(vehicle._id, vehicle.name)
											}
											disabled={deactivatingVehicleId === vehicle._id}
											className={`rounded-lg px-4 py-2 ${
												deactivatingVehicleId === vehicle._id
													? "bg-destructive/70"
													: "bg-destructive active:opacity-80"
											}`}
										>
											<Text className="text-destructive-foreground font-medium">
												{deactivatingVehicleId === vehicle._id
													? "Deactivating..."
													: "Deactivate"}
											</Text>
										</Pressable>
									) : null}
								</View>
							</View>
						))
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
