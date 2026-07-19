import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteMap } from "~/components/maps/route-map";
import { useLocationTracking } from "~/hooks/use-location-tracking";

type VisitStatus = "pending" | "completed" | "skipped";

function getStatusLabel(status: VisitStatus) {
	switch (status) {
		case "completed":
			return "Reached";
		case "skipped":
			return "Skipped";
		case "pending":
			return "Pending";
	}
}

function getDuration(startedAt: number, completedAt?: number) {
	const end = completedAt ?? Date.now();
	const diffMs = end - startedAt;
	const minutes = Math.floor(diffMs / 60000);
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;

	if (hours > 0) {
		return `${hours}h ${mins}m`;
	}
	return `${mins}m`;
}

export default function ActiveRunScreen() {
	const router = useRouter();
	const { runId } = useLocalSearchParams<{ runId: string }>();
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	const activeRun = useQuery(
		api.routeRuns.getRouteRunById,
		runId ? { routeRunId: runId as Id<"routeRuns"> } : "skip",
	);

	const completeRouteRun = useMutation(api.routeRuns.completeRouteRun);
	const cancelRouteRun = useMutation(api.routeRuns.cancelRouteRun);
	const markCheckpointReached = useMutation(api.routeRuns.markCheckpointReached);
	const skipCheckpoint = useMutation(api.routeRuns.skipCheckpoint);

	const runIdForTracking = runId && activeRun?.status === "running"
		? (runId as Id<"routeRuns">)
		: null;
	const { status: trackingStatus, lastLocation } =
		useLocationTracking(runIdForTracking);

	if (!runId) {
		return (
			<SafeAreaView className="flex-1 items-center justify-center">
				<Text className="text-muted-foreground">No active run found.</Text>
				<Pressable
					onPress={() => router.push("/dashboard/start-route")}
					className="bg-primary mt-4 rounded-lg px-6 py-2"
				>
					<Text className="text-primary-foreground font-semibold">
						Start a Route
					</Text>
				</Pressable>
			</SafeAreaView>
		);
	}

	if (activeRun === undefined) {
		return (
			<SafeAreaView className="flex-1 items-center justify-center">
				<ActivityIndicator size="large" />
			</SafeAreaView>
		);
	}

	if (!activeRun) {
		return (
			<SafeAreaView className="flex-1 items-center justify-center p-6">
				<Text className="text-foreground mb-2 text-lg font-semibold">
					Run not found
				</Text>
				<Pressable
					onPress={() => router.push("/dashboard/start-route")}
					className="bg-primary rounded-lg px-6 py-2"
				>
					<Text className="text-primary-foreground font-semibold">
						Back to routes
					</Text>
				</Pressable>
			</SafeAreaView>
		);
	}

	const isRunning = activeRun.status === "running";
	const completedCount = activeRun.visits.filter(
		(v) => v.status === "completed",
	).length;
	const totalCount = activeRun.visits.length;
	const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

	const handleMarkReached = async (visitId: string) => {
		setActionLoading(visitId);
		try {
			await markCheckpointReached({
				visitId: visitId as Id<"checkpointVisits">,
			});
		} catch (error) {
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to update checkpoint",
			);
		} finally {
			setActionLoading(null);
		}
	};

	const handleSkip = async (visitId: string) => {
		setActionLoading(visitId);
		try {
			await skipCheckpoint({
				visitId: visitId as Id<"checkpointVisits">,
			});
		} catch (error) {
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to skip checkpoint",
			);
		} finally {
			setActionLoading(null);
		}
	};

	const handleComplete = () => {
		Alert.alert("Complete Route", "Are you sure you want to complete this route?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Complete",
				style: "default",
				onPress: async () => {
					setActionLoading("complete");
					try {
						await completeRouteRun({
							routeRunId: runId as Id<"routeRuns">,
						});
						router.replace("/dashboard/route-history");
					} catch (error) {
						Alert.alert(
							"Error",
							error instanceof Error ? error.message : "Failed to complete route",
						);
					} finally {
						setActionLoading(null);
					}
				},
			},
		]);
	};

	const handleCancel = () => {
		Alert.alert("Cancel Route", "Are you sure you want to cancel this route?", [
			{ text: "No", style: "cancel" },
			{
				text: "Yes, cancel",
				style: "destructive",
				onPress: async () => {
					setActionLoading("cancel");
					try {
						await cancelRouteRun({
							routeRunId: runId as Id<"routeRuns">,
						});
						router.replace("/dashboard/(tabs)/routes");
					} catch (error) {
						Alert.alert(
							"Error",
							error instanceof Error ? error.message : "Failed to cancel route",
						);
					} finally {
						setActionLoading(null);
					}
				},
			},
		]);
	};

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ title: activeRun.route?.name ?? "Route Run" }} />
			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<View className="flex-row items-center justify-between">
					<View className="flex-1 pr-4">
						<Text className="text-foreground text-2xl font-bold">
							{activeRun.route?.name}
						</Text>
						{activeRun.route?.description ? (
							<Text className="text-muted-foreground mt-1 text-sm">
								{activeRun.route.description}
							</Text>
						) : null}
					</View>
					<View
						className={`rounded-full px-3 py-1 ${
							isRunning ? "bg-green-100" : "bg-muted"
						}`}
					>
						<Text
							className={`text-xs font-semibold ${
								isRunning ? "text-green-700" : "text-muted-foreground"
							}`}
						>
							{isRunning ? "Running" : activeRun.status}
						</Text>
					</View>
				</View>

				<Text className="text-muted-foreground mt-2 text-sm">
					Duration: {getDuration(activeRun.startedAt, activeRun.completedAt)}
				</Text>

				<View className="bg-card border-border mt-5 rounded-xl border p-4">
					<View className="mb-2 flex-row items-center justify-between">
						<Text className="text-foreground text-sm font-semibold">Progress</Text>
						<Text className="text-muted-foreground text-xs">
							{completedCount} / {totalCount}
						</Text>
					</View>
					<View className="h-2.5 rounded-full bg-muted">
						<View
							className="h-full rounded-full bg-green-500"
							style={{ width: `${progress}%` }}
						/>
					</View>
				</View>

				{Platform.OS !== "web" ? (
					<View className="mt-6">
						<View className="mb-2 flex-row items-center justify-between">
							<Text className="text-foreground text-lg font-semibold">
								{isRunning ? "Live Map" : "Route Map"}
							</Text>
							{isRunning ? (
								<View className="flex-row items-center gap-1.5">
									<View
										className={`h-2 w-2 rounded-full ${
											trackingStatus === "tracking"
												? "bg-green-500"
												: trackingStatus === "error"
													? "bg-red-500"
													: "bg-amber-500"
										}`}
									/>
									<Text className="text-muted-foreground text-xs">
										{trackingStatus === "tracking"
											? "Live"
											: trackingStatus === "requesting"
												? "Starting..."
												: trackingStatus === "error"
													? "Location off"
													: trackingStatus === "unavailable"
														? "Unavailable"
														: "Idle"}
									</Text>
								</View>
							) : null}
						</View>
						<RouteMap
							visits={activeRun.visits}
							driverLatitude={lastLocation?.latitude}
							driverLongitude={lastLocation?.longitude}
							routeRunId={runId as Id<"routeRuns">}
							showPath
						/>
					</View>
				) : null}

				<Text className="text-foreground mt-6 mb-3 text-lg font-semibold">
					Checkpoints
				</Text>

				<View className="gap-3">
					{activeRun.visits.map((visit, index) => {
						const isLoading = actionLoading === visit._id;
						const isPending = visit.status === "pending";
						const isCompleted = visit.status === "completed";
						const isSkipped = visit.status === "skipped";

						return (
							<View
								key={visit._id}
								className={`border-border rounded-xl border p-4 ${
									isPending && isRunning
										? "border-primary/40 bg-primary/5"
										: "bg-card"
								}`}
							>
								<View className="flex-row items-start justify-between">
									<View className="flex-1 pr-3">
										<View className="flex-row items-center gap-2">
											<Text className="text-foreground text-base font-semibold">
												{visit.checkpoint?.name ?? `Checkpoint ${index + 1}`}
											</Text>
										</View>
										{visit.reachedAt ? (
											<Text className="text-muted-foreground mt-1 ml-8 text-xs">
												Reached at {new Date(visit.reachedAt).toLocaleTimeString()}
											</Text>
										) : null}
									</View>
									<View
										className={`rounded-full px-2.5 py-0.5 ${
											isCompleted
												? "bg-green-100"
												: isSkipped
													? "bg-amber-100"
													: "bg-muted"
										}`}
									>
										<Text
											className={`text-xs font-semibold ${
												isCompleted
													? "text-green-700"
													: isSkipped
														? "text-amber-700"
														: "text-muted-foreground"
											}`}
										>
											{visit.status}
										</Text>
									</View>
								</View>

								{isPending && isRunning ? (
									<View className="mt-3 flex-row gap-2">
										<Pressable
											onPress={() => handleMarkReached(visit._id)}
											disabled={isLoading}
											className={`flex-1 rounded-lg py-2 ${
												isLoading ? "bg-green-300" : "bg-green-500 active:bg-green-600"
											}`}
										>
											{isLoading ? (
												<ActivityIndicator color="#ffffff" />
											) : (
												<Text className="text-center text-sm font-semibold text-white">
													Mark Reached
												</Text>
											)}
										</Pressable>
										<Pressable
											onPress={() => handleSkip(visit._id)}
											disabled={isLoading}
											className={`flex-1 rounded-lg py-2 ${
												isLoading ? "bg-amber-300" : "bg-amber-500 active:bg-amber-600"
											}`}
										>
											<Text className="text-center text-sm font-semibold text-white">
												Skip
											</Text>
										</Pressable>
									</View>
								) : null}
							</View>
						);
					})}
				</View>

				{isRunning ? (
					<View className="mt-8 gap-3">
						<Pressable
							onPress={handleComplete}
							disabled={actionLoading === "complete"}
							className={`rounded-lg py-3 ${
								actionLoading === "complete"
									? "bg-green-300"
									: "bg-green-500 active:bg-green-600"
							}`}
						>
							{actionLoading === "complete" ? (
								<ActivityIndicator color="#ffffff" />
							) : (
								<Text className="text-center font-semibold text-white">
									Complete Route
								</Text>
							)}
						</Pressable>
						<Pressable
							onPress={handleCancel}
							disabled={actionLoading === "cancel"}
							className={`rounded-lg border border-red-300 py-3 ${
								actionLoading === "cancel" ? "opacity-60" : "active:opacity-80"
							}`}
						>
							{actionLoading === "cancel" ? (
								<ActivityIndicator color="#ef4444" />
							) : (
								<Text className="text-center font-semibold text-red-500">
									Cancel Route
								</Text>
							)}
						</Pressable>
					</View>
				) : null}
			</ScrollView>
		</SafeAreaView>
	);
}
