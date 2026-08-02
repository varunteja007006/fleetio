import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
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

function getStatusColor(status: string) {
	switch (status) {
		case "completed":
			return "bg-green-100 text-green-700";
		case "cancelled":
			return "bg-red-100 text-red-700";
		case "delayed":
			return "bg-amber-100 text-amber-700";
		case "running":
			return "bg-blue-100 text-blue-700";
		default:
			return "bg-muted text-muted-foreground";
	}
}

function getDuration(startedAt: number, completedAt?: number) {
	if (!completedAt) return "—";
	const diffMs = completedAt - startedAt;
	const minutes = Math.floor(diffMs / 60000);
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatDate(ts: number) {
	return new Date(ts).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatTime(ts: number) {
	return new Date(ts).toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

const HistoryListView = () => {
	const router = useRouter();
	const {
		results: myRuns,
		status: paginatedStatus,
		loadMore,
	} = usePaginatedQuery(
		api.routeRuns.listMyRunsPaginated,
		{},
		{ initialNumItems: 10 },
	);

	return (
		<View className="mt-6 gap-3 px-6">
			{paginatedStatus === "LoadingFirstPage" ? (
				<ActivityIndicator />
			) : myRuns.length === 0 ? (
				<View className="items-center rounded-2xl border border-dashed border-border bg-card px-6 py-12">
					<Text className="text-foreground mb-1 text-base font-semibold">
						No route history
					</Text>
					<Text className="text-muted-foreground text-center text-sm">
						Start a route to see your history here.
					</Text>
				</View>
			) : (
				<>
					{myRuns.map((run) => (
						<Pressable
							key={run._id}
							onPress={() => router.push(`/dashboard/route/runs/${run._id}`)}
							className="bg-card border-border active:opacity-80 rounded-xl border p-4"
						>
							<View className="flex-row items-start justify-between">
								<View className="flex-1 pr-3">
									<Text className="text-foreground text-base font-semibold">
										{run.route?.name ?? "Unknown route"}
									</Text>
									<Text className="text-muted-foreground mt-1 text-xs">
										{formatDate(run.startedAt)} at {formatTime(run.startedAt)}
									</Text>
								</View>
								<View
									className={`rounded-full px-2.5 py-0.5 ${
										getStatusColor(run.status).split(" ")[0]
									}`}
								>
									<Text
										className={`text-xs font-semibold ${
											getStatusColor(run.status).split(" ")[1]
										}`}
									>
										{run.status}
									</Text>
								</View>
							</View>
							<View className="mt-2 flex-row gap-4">
								<Text className="text-muted-foreground text-xs">
									Duration: {getDuration(run.startedAt, run.completedAt)}
								</Text>
							</View>
						</Pressable>
					))}
					{paginatedStatus === "CanLoadMore" && (
						<Pressable
							onPress={() => loadMore(10)}
							className="border-border bg-card items-center rounded-xl border border-dashed px-4 py-3 active:opacity-70"
						>
							<Text className="text-muted-foreground text-sm font-medium">
								Load More
							</Text>
						</Pressable>
					)}
					{paginatedStatus === "LoadingMore" && <ActivityIndicator />}
				</>
			)}
		</View>
	);
};

const DriverRoutesView = () => {
	const router = useRouter();
	const [tab, setTab] = useState<"start" | "history">("start");
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
			router.replace(`/dashboard/route/runs/${runId}`);
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
		router.replace(`/dashboard/route/runs/${runId}`);
	};

	return (
		<View className="flex-1">
			<Stack.Screen options={{ title: "Routes", headerShown: false }} />
			<View className="px-6 py-6">
				<Text className="text-foreground text-2xl font-bold">My Routes</Text>
				<Text className="text-muted-foreground mt-1 text-sm">
					Routes assigned to you.
				</Text>

				<View className="bg-muted mt-5 flex-row rounded-xl p-1">
					<Pressable
						onPress={() => setTab("start")}
						className={`flex-1 rounded-lg py-2 ${
							tab === "start" ? "bg-card" : ""
						}`}
					>
						<Text
							className={`text-center text-sm font-semibold ${
								tab === "start"
									? "text-foreground"
									: "text-muted-foreground"
							}`}
						>
							Start Route
						</Text>
					</Pressable>
					<Pressable
						onPress={() => setTab("history")}
						className={`flex-1 rounded-lg py-2 ${
							tab === "history" ? "bg-card" : ""
						}`}
					>
						<Text
							className={`text-center text-sm font-semibold ${
								tab === "history"
									? "text-foreground"
									: "text-muted-foreground"
							}`}
						>
							History
						</Text>
					</Pressable>
				</View>
			</View>

			{tab === "history" ? (
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					<HistoryListView />
				</ScrollView>
			) : (
				<ScrollView
					className="flex-1 px-6"
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					<View className="-mt-3 gap-3">
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
													onPress={() =>
														handleContinueRoute(activeRun._id)
													}
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
														<ActivityIndicator
															color="#ffffff"
															size="small"
														/>
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
														a.active
															? "text-green-700"
															: "text-muted-foreground"
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
			)}
		</View>
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
