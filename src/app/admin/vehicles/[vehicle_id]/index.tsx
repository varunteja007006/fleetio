import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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

const providers = ["wheelseye", "loconav", "jiothings", "onelap"] as const;
type Provider = (typeof providers)[number];

const integrationSchema = z.object({
	provider: z.string().min(1, "Pick a provider"),
	accessToken: z.string().min(1, "Access token is required"),
	externalVehicleId: z.string(),
});

const statuses = ["active", "error", "disabled"] as const;
type Status = (typeof statuses)[number];

export default function VehicleDetailScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ vehicle_id?: string | string[] }>();
	const vehicleIdParam = Array.isArray(params.vehicle_id)
		? params.vehicle_id[0]
		: params.vehicle_id;
	const vehicleId = vehicleIdParam as Id<"vehicles"> | undefined;

	const vehicle = useQuery(api.vehicles.get, vehicleId ? { vehicleId } : "skip");
	const integration = useQuery(
		api.vehicleIntegrations.getForVehicle,
		vehicleId ? { vehicleId } : "skip",
	);
	const setForVehicle = useMutation(api.vehicleIntegrations.setForVehicle);
	const updateStatus = useMutation(api.vehicleIntegrations.updateStatus);
	const removeIntegration = useMutation(api.vehicleIntegrations.remove);

	const [isSaving, setIsSaving] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);

	const form = useAppForm({
		defaultValues: {
			provider: "wheelseye",
			accessToken: "",
			externalVehicleId: "",
		},
		validators: { onSubmit: integrationSchema },
		onSubmit: async ({ value }) => {
			if (!vehicleId) {
				return;
			}

			setIsSaving(true);
			try {
				const externalVehicleId = value.externalVehicleId.trim();

				await setForVehicle({
					vehicleId,
					provider: value.provider as Provider,
					accessToken: value.accessToken.trim(),
					externalVehicleId: externalVehicleId
						? externalVehicleId
						: undefined,
				});

				Alert.alert("Integration saved", "Tracking credentials were updated.");
				form.setFieldValue("accessToken", "");
			} catch (error) {
				Alert.alert(
					"Save failed",
					error instanceof Error ? error.message : "Please try again.",
				);
			} finally {
				setIsSaving(false);
			}
		},
	});

	const handleStatusChange = (status: Status) => {
		if (!integration) {
			return;
		}

		updateStatus({ integrationId: integration._id, status }).catch((error) => {
			Alert.alert(
				"Update failed",
				error instanceof Error ? error.message : "Please try again.",
			);
		});
	};

	const handleRemove = () => {
		if (!integration) {
			return;
		}

		Alert.alert("Remove integration", "Disconnect tracking for this vehicle?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Remove",
				style: "destructive",
				onPress: async () => {
					setIsRemoving(true);
					try {
						await removeIntegration({ integrationId: integration._id });
						Alert.alert("Integration removed", "Tracking was disconnected.");
					} catch (error) {
						Alert.alert(
							"Remove failed",
							error instanceof Error ? error.message : "Please try again.",
						);
					} finally {
						setIsRemoving(false);
					}
				},
			},
		]);
	};

	if (vehicle === undefined) {
		return (
			<SafeAreaView className="flex-1 items-center justify-center bg-background">
				<ActivityIndicator size="large" />
			</SafeAreaView>
		);
	}

	if (vehicle === null) {
		return (
			<SafeAreaView className="flex-1 items-center justify-center bg-background">
				<Text className="text-muted-foreground">Vehicle not found.</Text>
				<Pressable className="bg-primary mt-4 rounded-lg px-6 py-3" onPress={() => router.back()}>
					<Text className="text-primary-foreground font-semibold">Go back</Text>
				</Pressable>
			</SafeAreaView>
		);
	}

	const statusColor: Record<Status, string> = {
		active: "bg-emerald-500",
		error: "bg-destructive",
		disabled: "bg-muted",
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<Stack.Screen
				options={{
					headerShown: false,
					title: vehicle.name,
				}}
			/>
			<ScrollView className="flex-1 px-6 py-6">
				<View className="mb-6">
					<AdminHeader title={vehicle.name} />
					<View className="mt-2 flex-row items-center gap-2">
						<View className="bg-muted rounded-full px-3 py-1">
							<Text className="text-muted-foreground text-xs font-medium">
								{vehicle.registrationNumber}
							</Text>
						</View>
						{vehicle.make && (
							<View className="bg-muted rounded-full px-3 py-1">
								<Text className="text-muted-foreground text-xs font-medium">
									{vehicle.make}
									{vehicle.model ? ` ${vehicle.model}` : ""}
								</Text>
							</View>
						)}
					</View>
					{!vehicle.isActive && (
						<View className="mt-2 self-start rounded-full bg-destructive/10 px-3 py-1">
							<Text className="text-destructive text-xs font-medium">Deactivated</Text>
						</View>
					)}
				</View>

				{integration && (
					<View className="bg-card border-border rounded-xl border p-4">
						<View className="mb-3 flex-row items-center justify-between">
							<Text className="text-foreground text-lg font-semibold">Tracking</Text>
							<View
								className={`rounded-full px-3 py-1 ${statusColor[integration.status as Status] ?? statusColor.disabled}`}
							>
								<Text className="text-background text-xs font-semibold uppercase">
									{integration.status}
								</Text>
							</View>
						</View>
						<View className="mb-2 flex-row items-center justify-between">
							<Text className="text-muted-foreground text-sm">Provider</Text>
							<Text className="text-foreground text-sm font-medium capitalize">
								{integration.provider}
							</Text>
						</View>
						<View className="mb-2 flex-row items-center justify-between">
							<Text className="text-muted-foreground text-sm">Access token</Text>
							<Text className="text-foreground text-sm font-mono">
								{integration.hasToken ? integration.tokenMasked : "Not set"}
							</Text>
						</View>
						<View className="mb-2 flex-row items-center justify-between">
							<Text className="text-muted-foreground text-sm">External vehicle ID</Text>
							<Text className="text-foreground text-sm">
								{integration.externalVehicleId ?? "—"}
							</Text>
						</View>
						<View className="mb-3 flex-row items-center justify-between">
							<Text className="text-muted-foreground text-sm">Last sync</Text>
							<Text className="text-foreground text-sm">
								{integration.lastSyncAt
									? new Date(integration.lastSyncAt).toLocaleString()
									: "Never"}
							</Text>
						</View>

						<View className="flex-row gap-2">
							{statuses.map((status) => (
								<Pressable
									key={status}
									onPress={() => handleStatusChange(status)}
									className={`flex-1 rounded-lg border py-2 ${
										integration.status === status
											? "bg-primary border-primary"
											: "bg-card border-border active:opacity-70"
									}`}
								>
									<Text
										className={`text-center text-sm font-medium capitalize ${
											integration.status === status
												? "text-primary-foreground"
												: "text-muted-foreground"
										}`}
									>
										{status}
									</Text>
								</Pressable>
							))}
						</View>
						<Pressable
							onPress={handleRemove}
							disabled={isRemoving}
							className="border-destructive mt-3 rounded-lg border py-2 active:opacity-70"
						>
							{isRemoving ? (
								<ActivityIndicator size="small" />
							) : (
								<Text className="text-destructive text-center text-sm font-medium">
									Remove integration
								</Text>
							)}
						</Pressable>
					</View>
				)}

				<View className="mt-6">
					<Text className="text-foreground text-lg font-semibold">
						{integration ? "Update integration" : "Connect provider"}
					</Text>
					<Text className="text-muted-foreground mt-1 text-sm">
						Paste the access token issued by the tracking provider.
					</Text>

					<View className="bg-card border-border mt-5 rounded-xl border p-4">
						<View className="mb-3">
							<form.AppField name="provider">
								{(field) => (
									<View>
										<Text className="text-foreground mb-2 text-sm font-medium">
											Provider
										</Text>
										<View className="flex-row flex-wrap gap-2">
											{providers.map((provider) => (
												<Pressable
													key={provider}
													onPress={() => field.handleChange(provider)}
													className={`rounded-full border px-4 py-2 ${
														field.state.value === provider
															? "bg-primary border-primary"
															: "bg-card border-border active:opacity-70"
													}`}
												>
													<Text
														className={`text-sm font-medium capitalize ${
															field.state.value === provider
																? "text-primary-foreground"
																: "text-muted-foreground"
														}`}
													>
														{provider}
													</Text>
												</Pressable>
											))}
										</View>
									</View>
								)}
							</form.AppField>
						</View>

						<form.AppField name="accessToken">
							{(field) => (
								<field.Input
									label="Access token"
									placeholder="Paste provider token"
									autoCapitalize="none"
									editable={!isSaving}
								/>
							)}
						</form.AppField>

						<View className="mt-3">
							<form.AppField name="externalVehicleId">
								{(field) => (
									<field.Input
										label="External vehicle ID"
										placeholder="Optional, eg: VH-101"
										autoCapitalize="none"
										editable={!isSaving}
									/>
								)}
							</form.AppField>
						</View>

						<Pressable
							onPress={() => form.handleSubmit()}
							disabled={isSaving}
							className={`bg-primary mt-4 rounded-lg py-3 ${
								isSaving ? "opacity-60" : "active:opacity-80"
							}`}
						>
							{isSaving ? (
								<ActivityIndicator color="#ffffff" />
							) : (
								<Text className="text-primary-foreground text-center font-semibold">
									{integration ? "Save integration" : "Connect provider"}
								</Text>
							)}
						</Pressable>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
