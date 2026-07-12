import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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

type DriverOption = {
	_id: Id<"profiles">;
	firstName?: string;
	lastName?: string;
	phoneNumber?: string;
};

type RouteOption = {
	_id: Id<"routes">;
	name: string;
};

export default function AssignmentsAdminScreen() {
	const assignments = useQuery(api.routeAssignments.listAll);
	const drivers = useQuery(api.profile.getDrivers);
	const routes = useQuery(api.routes.list, {});
	const createAssignment = useMutation(api.routeAssignments.create);
	const deleteAssignment = useMutation(api.routeAssignments.remove);

	const [showCreateForm, setShowCreateForm] = useState(false);
	const [selectedDriver, setSelectedDriver] = useState<Id<"profiles"> | null>(null);
	const [selectedRoute, setSelectedRoute] = useState<Id<"routes"> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [deletingId, setDeletingId] = useState<Id<"routeAssignments"> | null>(null);

	const handleCreate = async () => {
		if (!selectedDriver || !selectedRoute) {
			Alert.alert("Validation", "Please select both a driver and a route.");
			return;
		}

		setIsSubmitting(true);
		try {
			await createAssignment({
				profileId: selectedDriver,
				routeId: selectedRoute,
			});
			setShowCreateForm(false);
			setSelectedDriver(null);
			setSelectedRoute(null);
		} catch (error) {
			Alert.alert(
				"Assignment failed",
				error instanceof Error ? error.message : "Please try again.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = (assignmentId: Id<"routeAssignments">) => {
		Alert.alert("Remove assignment", "Are you sure you want to remove this assignment?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Remove",
				style: "destructive",
				onPress: async () => {
					setDeletingId(assignmentId);
					try {
						await deleteAssignment({ assignmentId });
					} catch (error) {
						Alert.alert(
							"Remove failed",
							error instanceof Error ? error.message : "Please try again.",
						);
					} finally {
						setDeletingId(null);
					}
				},
			},
		]);
	};

	const isLoading =
		assignments === undefined || drivers === undefined || routes === undefined;

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ headerShown: false }} />
			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text className="text-foreground text-2xl font-bold">Route Assignments</Text>
				<Text className="text-muted-foreground mt-1 text-sm">
					Assign routes to drivers and manage existing assignments.
				</Text>

				<Pressable
					onPress={() => setShowCreateForm(!showCreateForm)}
					className={`mt-5 rounded-lg py-3 ${
						showCreateForm
							? "bg-secondary"
							: "bg-primary active:opacity-80"
					}`}
				>
					<Text
						className={`text-center font-semibold ${
							showCreateForm
								? "text-secondary-foreground"
								: "text-primary-foreground"
						}`}
					>
						{showCreateForm ? "Cancel" : "New Assignment"}
					</Text>
				</Pressable>

				{showCreateForm && (
					<View className="bg-card border-border mt-4 rounded-xl border p-4">
						<Text className="text-foreground mb-3 text-lg font-semibold">
							Assign route to driver
						</Text>

						<Text className="text-foreground mb-2 text-sm font-medium">
							Select driver
						</Text>
						<View className="mb-4 flex-row flex-wrap gap-2">
							{drivers && drivers.length > 0 ? (
								drivers.map((driver) => {
									const isSelected = selectedDriver === driver._id;
									const name = [driver.firstName, driver.lastName]
										.filter(Boolean)
										.join(" ");
									return (
										<Pressable
											key={driver._id}
											onPress={() =>
												setSelectedDriver(
													isSelected ? null : driver._id,
												)
											}
											className={`rounded-lg border px-3 py-2 ${
												isSelected
													? "bg-primary border-primary"
													: "bg-card border-border"
											}`}
										>
											<Text
												className={`text-sm font-medium ${
													isSelected
														? "text-primary-foreground"
														: "text-foreground"
												}`}
											>
												{name || driver.phoneNumber || "Unknown"}
											</Text>
										</Pressable>
									);
								})
							) : (
								<Text className="text-muted-foreground text-sm">
									No approved drivers available.
								</Text>
							)}
						</View>

						<Text className="text-foreground mb-2 text-sm font-medium">
							Select route
						</Text>
						<View className="mb-4 flex-row flex-wrap gap-2">
							{routes && routes.length > 0 ? (
								routes.map((route) => {
									const isSelected = selectedRoute === route._id;
									return (
										<Pressable
											key={route._id}
											onPress={() =>
												setSelectedRoute(
													isSelected ? null : route._id,
												)
											}
											className={`rounded-lg border px-3 py-2 ${
												isSelected
													? "bg-primary border-primary"
													: "bg-card border-border"
											}`}
										>
											<Text
												className={`text-sm font-medium ${
													isSelected
														? "text-primary-foreground"
														: "text-foreground"
												}`}
											>
												{route.name}
											</Text>
										</Pressable>
									);
								})
							) : (
								<Text className="text-muted-foreground text-sm">
									No routes available.
								</Text>
							)}
						</View>

						<Pressable
							onPress={handleCreate}
							disabled={isSubmitting || !selectedDriver || !selectedRoute}
							className={`bg-primary rounded-lg py-3 ${
								isSubmitting || !selectedDriver || !selectedRoute
									? "opacity-60"
									: "active:opacity-80"
							}`}
						>
							{isSubmitting ? (
								<ActivityIndicator color="#ffffff" />
							) : (
								<Text className="text-primary-foreground text-center font-semibold">
									Assign route
								</Text>
							)}
						</Pressable>
					</View>
				)}

				<View className="mt-6 gap-3">
					<Text className="text-foreground text-lg font-semibold">
						Current assignments
					</Text>
					{isLoading ? (
						<ActivityIndicator />
					) : assignments.length === 0 ? (
						<Text className="text-muted-foreground text-sm">
							No assignments yet. Create one using the form above.
						</Text>
					) : (
						assignments.map((a) => {
							const driverName = a.driverProfile
								? [a.driverProfile.firstName, a.driverProfile.lastName]
										.filter(Boolean)
										.join(" ")
								: "Unknown driver";
							const assignerName = a.assignerProfile
								? [a.assignerProfile.firstName, a.assignerProfile.lastName]
										.filter(Boolean)
										.join(" ")
								: "Unknown";
							const routeName = a.route?.name ?? "Unknown route";

							return (
								<View
									key={a._id}
									className="bg-card border-border rounded-xl border p-4"
								>
									<View className="flex-row items-start justify-between">
										<View className="flex-1 pr-4">
											<Text className="text-foreground text-base font-semibold">
												{routeName}
											</Text>
											<Text className="text-muted-foreground mt-1 text-sm">
												Driver: {driverName}
											</Text>
											<Text className="text-muted-foreground text-sm">
												Assigned by: {assignerName}
											</Text>
										</View>
										<View
											className={`rounded-full px-3 py-1 ${
												a.active ? "bg-green-100" : "bg-muted"
											}`}
										>
											<Text
												className={`text-xs font-semibold ${
													a.active ? "text-green-700" : "text-muted-foreground"
												}`}
											>
												{a.active ? "Active" : "Inactive"}
											</Text>
										</View>
									</View>

									<Pressable
										onPress={() => handleDelete(a._id)}
										disabled={deletingId === a._id}
										className={`mt-3 self-start rounded-lg px-4 py-2 ${
											deletingId === a._id
												? "bg-destructive/70"
												: "bg-destructive active:opacity-80"
										}`}
									>
										<Text className="text-destructive-foreground text-sm font-medium">
											{deletingId === a._id ? "Removing..." : "Remove"}
										</Text>
									</Pressable>
								</View>
							);
						})
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
