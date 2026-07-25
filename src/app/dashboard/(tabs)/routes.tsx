import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
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

function getDisplayName(
	profile?: {
		firstName?: string;
		lastName?: string;
		phoneNumber?: string;
	} | null,
) {
	if (!profile) return "Unknown";
	return (
		[profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
		profile.phoneNumber ||
		"Unknown"
	);
}

const AdminRoutesView = () => {
	const allRoutes = useQuery(api.routes.list, {});
	const allAssignments = useQuery(api.routeAssignments.listAll);

	const routeList = allRoutes ?? [];
	const assignmentsByRoute = new Map<
		Id<"routes">,
		NonNullable<typeof allAssignments>[number][]
	>();
	if (allAssignments) {
		for (const a of allAssignments) {
			if (a.active && a.route && !a.route.isDeleted) {
				const existing = assignmentsByRoute.get(a.routeId);
				if (existing) {
					existing.push(a);
				} else {
					assignmentsByRoute.set(a.routeId, [a]);
				}
			}
		}
	}

	const isLoading = allRoutes === undefined || allAssignments === undefined;

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ title: "Routes", headerShown: false }} />
			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text className="text-foreground text-2xl font-bold">Routes</Text>
				<Text className="text-muted-foreground mt-1 text-sm">
					Browse all available routes.
				</Text>

				<View className="mt-6 gap-3">
					{isLoading ? (
						<ActivityIndicator />
					) : routeList.length === 0 ? (
						<Text className="text-muted-foreground text-sm">
							No routes available.
						</Text>
					) : (
						routeList.map((route) => {
							const activeAssignments = assignmentsByRoute.get(route._id);

							return (
								<View
									key={route._id}
									className="bg-card border-border rounded-xl border p-4"
								>
									<View className="flex-row items-start justify-between">
										<View className="flex-1 pr-4">
											<Text className="text-foreground text-base font-semibold">
												{route.name}
											</Text>
											{route.description ? (
												<Text className="text-muted-foreground mt-1 text-sm">
													{route.description}
												</Text>
											) : null}
										</View>
										<View className="rounded-full bg-primary/15 px-3 py-0.5">
											<Text className="text-primary text-xs font-medium">
												{route.isDeleted ? "Archived" : "Active"}
											</Text>
										</View>
									</View>
									{route.isDeleted ? null : activeAssignments &&
									  activeAssignments.length > 0 ? (
										<View className="mt-3 gap-2">
											{activeAssignments.map((a) => (
												<View
													key={a._id}
													className="flex-row items-center gap-2"
												>
													<View className="h-2 w-2 rounded-full bg-green-500" />
													<Text className="text-foreground text-sm">
														{getDisplayName(a.driverProfile)}
													</Text>
												</View>
											))}
										</View>
									) : (
										<View className="mt-3">
											<View className="rounded-full bg-muted self-start px-3 py-0.5">
												<Text className="text-muted-foreground text-xs font-medium">
													Unassigned
												</Text>
											</View>
										</View>
									)}
								</View>
							);
						})
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

const DriverRoutesView = () => {
	const router = useRouter();
	const myAssignments = useQuery(api.routeAssignments.listByDriver);
	const activeRun = useQuery(api.routeRuns.getActiveRun);
	const startRouteRun = useMutation(api.routeRuns.startRouteRun);
	const [startingRouteId, setStartingRouteId] = useState<string | null>(null);

	const assignedRoutes = myAssignments ?? [];
	const hasActiveRun = activeRun !== null && activeRun !== undefined;

	const handleStartRoute = async (routeId: Id<"routes">) => {
		setStartingRouteId(routeId);
		try {
			const runId = await startRouteRun({ routeId });
			router.replace(`/dashboard/active-run?runId=${runId}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : "";
			if (message.includes("already have an active route run")) {
				Alert.alert(
					"Route already in progress",
					"You already have a route in progress. Please complete or cancel it before starting a new one.",
				);
			} else if (message.includes("Only drivers")) {
				Alert.alert(
					"Action not available",
					"Only drivers can start routes. Contact your admin if you believe this is a mistake.",
				);
			} else if (message.includes("not found") || message.includes("deleted")) {
				Alert.alert(
					"Route unavailable",
					"This route is no longer available. It may have been deleted or deactivated.",
				);
			} else {
				Alert.alert(
					"Failed to start route",
					message ||
						"Please try again. If the issue persists, contact support.",
				);
			}
		} finally {
			setStartingRouteId(null);
		}
	};

	const handleContinueRoute = (runId: Id<"routeRuns">) => {
		router.replace(`/dashboard/active-run?runId=${runId}`);
	};

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ title: "Routes", headerShown: false }} />
			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text className="text-foreground text-2xl font-bold">My Routes</Text>
				<Text className="text-muted-foreground mt-1 text-sm">
					Routes assigned to you.
				</Text>

				<View className="mt-6 gap-3">
					{myAssignments === undefined || activeRun === undefined ? (
						<ActivityIndicator />
					) : assignedRoutes.length === 0 ? (
						<View className="items-center rounded-2xl border border-dashed border-border bg-card px-6 py-12">
							<Text className="text-foreground mb-1 text-base font-semibold">
								No routes assigned
							</Text>
							<Text className="text-muted-foreground text-center text-sm">
								You haven&apos;t been assigned any routes yet. Check back later.
							</Text>
						</View>
					) : (
						assignedRoutes.map((a) => {
							const isLoading = startingRouteId === a.routeId;

							return (
								<View
									key={a._id}
									className="bg-card border-border rounded-xl border p-4"
								>
									<View className="flex-row items-start">
										<View className="flex-1 pr-3">
											<Text
												numberOfLines={2}
												className="text-foreground text-base font-semibold"
											>
												{a.route?.name ?? "Unknown route"}
											</Text>
											{a.route?.description ? (
												<Text
													numberOfLines={2}
													className="text-muted-foreground mt-1 text-sm"
												>
													{a.route.description}
												</Text>
											) : null}
										</View>
										{hasActiveRun ? (
											<Pressable
												onPress={() => handleContinueRoute(activeRun._id)}
												className="shrink-0 bg-blue-500 rounded-lg px-4 py-2"
											>
												<Text className="text-white font-semibold text-sm">
													In Progress
												</Text>
											</Pressable>
										) : (
											<Pressable
												onPress={() => handleStartRoute(a.routeId)}
												disabled={isLoading}
												className="shrink-0 bg-primary rounded-lg px-4 py-2"
											>
												{isLoading ? (
													<ActivityIndicator color="#ffffff" size="small" />
												) : (
													<Text className="text-primary-foreground font-semibold text-sm">
														Start
													</Text>
												)}
											</Pressable>
										)}
									</View>
									<View className="mt-3 flex-row flex-wrap items-center gap-2">
										<View
											className={`rounded-full px-3 py-0.5 ${
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
								</View>
							);
						})
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

const Routes = () => {
	const userProfile = useQuery(api.profile.getUserProfile);

	const role = userProfile?.role;
	const isAdminOrManager = role === "admin" || role === "manager";

	if (userProfile === undefined) {
		return (
			<SafeAreaView className="flex-1 items-center justify-center">
				<ActivityIndicator />
			</SafeAreaView>
		);
	}

	if (isAdminOrManager) {
		return <AdminRoutesView />;
	}

	return <DriverRoutesView />;
};

export default Routes;
