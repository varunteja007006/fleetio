import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import z from "zod";

import { useAppForm } from "~/components/forms/hooks";

const updateRouteSchema = z.object({
	name: z.string().min(1, "Route name is required"),
	description: z.string(),
});

export default function RouteAdminDetailScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ route_id?: string | string[] }>();
	const routeIdParam = Array.isArray(params.route_id)
		? params.route_id[0]
		: params.route_id;
	const routeId = routeIdParam as Id<"routes"> | undefined;

	const route = useQuery(api.routes.getById, routeId ? { routeId } : "skip");
	const updateRoute = useMutation(api.routes.update);
	const deleteRoute = useMutation(api.routes.remove);

	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const checkpoints = useQuery(
		api.checkpoints.listByRoute,
		routeId ? { routeId } : "skip",
	);
	const createCheckpoint = useMutation(api.checkpoints.create);
	const updateCheckpoint = useMutation(api.checkpoints.update);
	const deleteCheckpoint = useMutation(api.checkpoints.remove);
	const reorderCheckpoint = useMutation(api.checkpoints.reorder);

	const [showAddForm, setShowAddForm] = useState(false);
	const [addName, setAddName] = useState("");
	const [addLat, setAddLat] = useState("");
	const [addLng, setAddLng] = useState("");
	const [addTravelTime, setAddTravelTime] = useState("");
	const [addingCheckpoint, setAddingCheckpoint] = useState(false);

	const [editingCheckpointId, setEditingCheckpointId] =
		useState<Id<"checkpoints"> | null>(null);
	const [editName, setEditName] = useState("");
	const [editLat, setEditLat] = useState("");
	const [editLng, setEditLng] = useState("");
	const [editTravelTime, setEditTravelTime] = useState("");
	const [savingEdit, setSavingEdit] = useState(false);
	const [deletingCheckpointId, setDeletingCheckpointId] =
		useState<Id<"checkpoints"> | null>(null);

	const form = useAppForm({
		defaultValues: {
			name: "",
			description: "",
		},
		validators: { onSubmit: updateRouteSchema },
		onSubmit: async ({ value }) => {
			if (!routeId) {
				return;
			}

			setIsSaving(true);
			try {
				const description = value.description.trim();

				await updateRoute({
					routeId,
					name: value.name,
					description: description ? description : undefined,
				});

				Alert.alert("Route updated", "Route details were saved.");
			} catch (error) {
				Alert.alert(
					"Update failed",
					error instanceof Error ? error.message : "Please try again.",
				);
			} finally {
				setIsSaving(false);
			}
		},
	});

	useEffect(() => {
		if (!route) {
			return;
		}

		form.setFieldValue("name", route.name);
		form.setFieldValue("description", route.description ?? "");
	}, [form, route]);

	const handleDelete = () => {
		if (!routeId || !route) {
			return;
		}

		Alert.alert("Delete route", `Archive ${route.name}?`, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					setIsDeleting(true);
					try {
						await deleteRoute({ routeId });
						router.back();
					} catch (error) {
						Alert.alert(
							"Delete failed",
							error instanceof Error ? error.message : "Please try again.",
						);
					} finally {
						setIsDeleting(false);
					}
				},
			},
		]);
	};

	const handleAddCheckpoint = async () => {
		if (!routeId) {
			return;
		}

		if (!addName.trim()) {
			Alert.alert("Validation", "Checkpoint name is required.");
			return;
		}

		const lat = parseFloat(addLat);
		const lng = parseFloat(addLng);
		const travelTime = parseInt(addTravelTime, 10);

		if (isNaN(lat) || isNaN(lng)) {
			Alert.alert("Validation", "Valid latitude and longitude are required.");
			return;
		}

		if (isNaN(travelTime) || travelTime < 0) {
			Alert.alert("Validation", "Valid expected travel time is required.");
			return;
		}

		setAddingCheckpoint(true);
		try {
			await createCheckpoint({
				routeId,
				name: addName.trim(),
				latitude: lat,
				longitude: lng,
				expectedTravelMinutes: travelTime,
			});
			setAddName("");
			setAddLat("");
			setAddLng("");
			setAddTravelTime("");
			setShowAddForm(false);
		} catch (error) {
			Alert.alert(
				"Add checkpoint failed",
				error instanceof Error ? error.message : "Please try again.",
			);
		} finally {
			setAddingCheckpoint(false);
		}
	};

	const startEditing = (cp: {
		_id: Id<"checkpoints">;
		name: string;
		latitude: number;
		longitude: number;
		expectedTravelMinutes: number;
	}) => {
		setEditingCheckpointId(cp._id);
		setEditName(cp.name);
		setEditLat(cp.latitude.toString());
		setEditLng(cp.longitude.toString());
		setEditTravelTime(cp.expectedTravelMinutes.toString());
	};

	const handleSaveEdit = async (checkpointId: Id<"checkpoints">) => {
		if (!editName.trim()) {
			Alert.alert("Validation", "Checkpoint name is required.");
			return;
		}

		const lat = parseFloat(editLat);
		const lng = parseFloat(editLng);
		const travelTime = parseInt(editTravelTime, 10);

		if (isNaN(lat) || isNaN(lng)) {
			Alert.alert("Validation", "Valid latitude and longitude are required.");
			return;
		}

		if (isNaN(travelTime) || travelTime < 0) {
			Alert.alert("Validation", "Valid expected travel time is required.");
			return;
		}

		setSavingEdit(true);
		try {
			await updateCheckpoint({
				checkpointId,
				name: editName.trim(),
				latitude: lat,
				longitude: lng,
				expectedTravelMinutes: travelTime,
			});
			setEditingCheckpointId(null);
		} catch (error) {
			Alert.alert(
				"Update failed",
				error instanceof Error ? error.message : "Please try again.",
			);
		} finally {
			setSavingEdit(false);
		}
	};

	const handleReorder = async (
		checkpointId: Id<"checkpoints">,
		newSequence: number,
	) => {
		try {
			await reorderCheckpoint({ checkpointId, newSequence });
		} catch (error) {
			Alert.alert(
				"Reorder failed",
				error instanceof Error ? error.message : "Please try again.",
			);
		}
	};

	const handleDeleteCheckpoint = (
		checkpointId: Id<"checkpoints">,
		name: string,
	) => {
		Alert.alert("Delete checkpoint", `Remove "${name}" from this route?`, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					setDeletingCheckpointId(checkpointId);
					try {
						await deleteCheckpoint({ checkpointId });
					} catch (error) {
						Alert.alert(
							"Delete failed",
							error instanceof Error ? error.message : "Please try again.",
						);
					} finally {
						setDeletingCheckpointId(null);
					}
				},
			},
		]);
	};

	if (!routeId) {
		return (
			<SafeAreaView className=" flex-1 items-center justify-center px-6">
				<Text className="text-foreground text-center text-base">
					Invalid route id.
				</Text>
			</SafeAreaView>
		);
	}

	if (route === undefined) {
		return (
			<SafeAreaView className=" flex-1 items-center justify-center">
				<ActivityIndicator />
			</SafeAreaView>
		);
	}

	if (!route || route.isDeleted) {
		return (
			<SafeAreaView className=" flex-1 items-center justify-center px-6">
				<Text className="text-foreground text-center text-base">
					Route not found.
				</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className=" flex-1">
			<Stack.Screen options={{ title: "Edit Route", headerShown: false }} />
			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text className="text-foreground text-2xl font-bold">Edit route</Text>
				<Text className="text-muted-foreground mt-1 text-sm">
					Update route table values and save changes.
				</Text>

				<View className="bg-card border-border mt-5 rounded-xl border p-4">
					<View className="mb-3">
						<form.AppField name="name">
							{(field) => (
								<field.Input
									label="Route name"
									placeholder="Eg: North Campus Loop"
									autoCapitalize="words"
									editable={!isSaving && !isDeleting}
								/>
							)}
						</form.AppField>
					</View>
					<form.AppField name="description">
						{(field) => (
							<field.Input
								label="Description"
								placeholder="Optional notes"
								autoCapitalize="sentences"
								editable={!isSaving && !isDeleting}
							/>
						)}
					</form.AppField>

					<Pressable
						onPress={async () => form.handleSubmit()}
						disabled={isSaving || isDeleting}
						className={`bg-primary mt-4 rounded-lg py-3 ${
							isSaving || isDeleting ? "opacity-60" : "active:opacity-80"
						}`}
					>
						{isSaving ? (
							<ActivityIndicator color="#ffffff" />
						) : (
							<Text className="text-primary-foreground text-center font-semibold">
								Save changes
							</Text>
						)}
					</Pressable>

					<Pressable
						onPress={handleDelete}
						disabled={isSaving || isDeleting}
						className={`bg-destructive mt-3 rounded-lg py-3 ${
							isSaving || isDeleting ? "opacity-60" : "active:opacity-80"
						}`}
					>
						{isDeleting ? (
							<ActivityIndicator color="#ffffff" />
						) : (
							<Text className="text-destructive-foreground text-center font-semibold">
								Delete route
							</Text>
						)}
					</Pressable>
				</View>

				<View className="mt-8">
					<View className="flex-row items-center justify-between">
						<Text className="text-foreground text-xl font-bold">
							Checkpoints
						</Text>
						<Pressable
							onPress={() => setShowAddForm(!showAddForm)}
							className="bg-primary rounded-lg px-4 py-2 active:opacity-80"
						>
							<Text className="text-primary-foreground font-medium">
								{showAddForm ? "Cancel" : "Add checkpoint"}
							</Text>
						</Pressable>
					</View>

					{showAddForm && (
						<View className="bg-card border-border mt-4 rounded-xl border p-4">
							<Text className="text-foreground mb-3 text-base font-semibold">
								New checkpoint
							</Text>
							<TextInput
								value={addName}
								onChangeText={setAddName}
								placeholder="Checkpoint name"
								placeholderTextColor="#9ca3af"
								className="bg-background text-foreground border-border mb-2 rounded-lg border px-4 py-3 text-base"
								editable={!addingCheckpoint}
							/>
							<View className="mb-2 flex-row gap-2">
								<TextInput
									value={addLat}
									onChangeText={setAddLat}
									placeholder="Latitude"
									placeholderTextColor="#9ca3af"
									keyboardType="numeric"
									className="bg-background text-foreground border-border flex-1 rounded-lg border px-4 py-3 text-base"
									editable={!addingCheckpoint}
								/>
								<TextInput
									value={addLng}
									onChangeText={setAddLng}
									placeholder="Longitude"
									placeholderTextColor="#9ca3af"
									keyboardType="numeric"
									className="bg-background text-foreground border-border flex-1 rounded-lg border px-4 py-3 text-base"
									editable={!addingCheckpoint}
								/>
							</View>
							<TextInput
								value={addTravelTime}
								onChangeText={setAddTravelTime}
								placeholder="Expected travel time (minutes)"
								placeholderTextColor="#9ca3af"
								keyboardType="numeric"
								className="bg-background text-foreground border-border mb-3 rounded-lg border px-4 py-3 text-base"
								editable={!addingCheckpoint}
							/>
							<Pressable
								onPress={handleAddCheckpoint}
								disabled={addingCheckpoint}
								className={`bg-primary rounded-lg py-3 ${
									addingCheckpoint ? "opacity-60" : "active:opacity-80"
								}`}
							>
								{addingCheckpoint ? (
									<ActivityIndicator color="#ffffff" />
								) : (
									<Text className="text-primary-foreground text-center font-semibold">
										Add checkpoint
									</Text>
								)}
							</Pressable>
						</View>
					)}

					<View className="mt-4 gap-3">
						{checkpoints === undefined ? (
							<ActivityIndicator />
						) : checkpoints.length === 0 ? (
							<Text className="text-muted-foreground text-sm">
								No checkpoints yet. Add the first one.
							</Text>
						) : (
							checkpoints.map((cp, index) => (
								<View
									key={cp._id}
									className="bg-card border-border rounded-xl border p-4"
								>
									{editingCheckpointId === cp._id ? (
										<View>
											<TextInput
												value={editName}
												onChangeText={setEditName}
												placeholder="Checkpoint name"
												placeholderTextColor="#9ca3af"
												className="bg-background text-foreground border-border mb-2 rounded-lg border px-4 py-3 text-base"
												editable={!savingEdit}
											/>
											<View className="mb-2 flex-row gap-2">
												<TextInput
													value={editLat}
													onChangeText={setEditLat}
													placeholder="Latitude"
													placeholderTextColor="#9ca3af"
													keyboardType="numeric"
													className="bg-background text-foreground border-border flex-1 rounded-lg border px-4 py-3 text-base"
													editable={!savingEdit}
												/>
												<TextInput
													value={editLng}
													onChangeText={setEditLng}
													placeholder="Longitude"
													placeholderTextColor="#9ca3af"
													keyboardType="numeric"
													className="bg-background text-foreground border-border flex-1 rounded-lg border px-4 py-3 text-base"
													editable={!savingEdit}
												/>
											</View>
											<TextInput
												value={editTravelTime}
												onChangeText={setEditTravelTime}
												placeholder="Expected travel time (minutes)"
												placeholderTextColor="#9ca3af"
												keyboardType="numeric"
												className="bg-background text-foreground border-border mb-3 rounded-lg border px-4 py-3 text-base"
												editable={!savingEdit}
											/>
											<View className="flex-row gap-2">
												<Pressable
													onPress={() => handleSaveEdit(cp._id)}
													disabled={savingEdit}
													className={`bg-primary flex-1 rounded-lg py-2 ${
														savingEdit ? "opacity-60" : "active:opacity-80"
													}`}
												>
													{savingEdit ? (
														<ActivityIndicator color="#ffffff" />
													) : (
														<Text className="text-primary-foreground text-center font-semibold">
															Save
														</Text>
													)}
												</Pressable>
												<Pressable
													onPress={() => setEditingCheckpointId(null)}
													className="bg-secondary flex-1 rounded-lg py-2 active:opacity-80"
												>
													<Text className="text-secondary-foreground text-center font-semibold">
														Cancel
													</Text>
												</Pressable>
											</View>
										</View>
									) : (
										<View>
											<View className="flex-row items-center gap-3">
												<View className="bg-primary rounded-full px-3 py-1">
													<Text className="text-primary-foreground text-sm font-bold">
														{cp.sequence + 1}
													</Text>
												</View>
												<View className="flex-1">
													<Text className="text-foreground text-base font-semibold">
														{cp.name}
													</Text>
													<Text className="text-muted-foreground text-sm">
														{cp.latitude.toFixed(6)}, {cp.longitude.toFixed(6)}{" "}
														· {cp.expectedTravelMinutes} min
													</Text>
												</View>
											</View>
											<View className="mt-3 flex-row gap-2">
												<Pressable
													onPress={() => startEditing(cp)}
													className="bg-secondary rounded-lg px-3 py-2 active:opacity-80"
												>
													<Text className="text-secondary-foreground text-sm font-medium">
														Edit
													</Text>
												</Pressable>
												{index > 0 && (
													<Pressable
														onPress={() =>
															handleReorder(cp._id, cp.sequence - 1)
														}
														className="bg-secondary rounded-lg px-3 py-2 active:opacity-80"
													>
														<Text className="text-secondary-foreground text-sm font-medium">
															↑
														</Text>
													</Pressable>
												)}
												{index < checkpoints.length - 1 && (
													<Pressable
														onPress={() =>
															handleReorder(cp._id, cp.sequence + 1)
														}
														className="bg-secondary rounded-lg px-3 py-2 active:opacity-80"
													>
														<Text className="text-secondary-foreground text-sm font-medium">
															↓
														</Text>
													</Pressable>
												)}
												<Pressable
													onPress={() =>
														handleDeleteCheckpoint(cp._id, cp.name)
													}
													disabled={deletingCheckpointId === cp._id}
													className={`ml-auto rounded-lg px-3 py-2 ${
														deletingCheckpointId === cp._id
															? "bg-destructive/70"
															: "bg-destructive active:opacity-80"
													}`}
												>
													<Text className="text-destructive-foreground text-sm font-medium">
														{deletingCheckpointId === cp._id
															? "Deleting..."
															: "Delete"}
													</Text>
												</Pressable>
											</View>
										</View>
									)}
								</View>
							))
						)}
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
