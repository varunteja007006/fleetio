import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

	if (hours > 0) {
		return `${hours}h ${mins}m`;
	}
	return `${mins}m`;
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

export default function RouteHistoryScreen() {
	const router = useRouter();
	const myRuns = useQuery(api.routeRuns.listMyRuns);

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ title: "Route History" }} />
			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text className="text-foreground text-2xl font-bold">Route History</Text>
				<Text className="text-muted-foreground mt-1 text-sm">
					Your past and current route runs.
				</Text>

				<View className="mt-6 gap-3">
					{myRuns === undefined ? (
						<ActivityIndicator />
					) : myRuns.length === 0 ? (
						<View className="items-center rounded-2xl border border-dashed border-border bg-card px-6 py-12">
							<Text className="text-foreground mb-1 text-base font-semibold">
								No route history
							</Text>
							<Text className="text-muted-foreground text-center text-sm">
								Start a route to see your history here.
							</Text>
							<Pressable
								onPress={() => router.push("/dashboard/start-route")}
								className="bg-primary mt-4 rounded-lg px-6 py-2"
							>
								<Text className="text-primary-foreground font-semibold">
									Start a Route
								</Text>
							</Pressable>
						</View>
					) : (
						myRuns.map((run) => (
							<Pressable
								key={run._id}
								onPress={() =>
									router.push(`/dashboard/active-run?runId=${run._id}`)
								}
								className="bg-card border-border active:opacity-80 rounded-xl border p-4"
							>
								<View className="flex-row items-start justify-between">
									<View className="flex-1 pr-3">
										<Text className="text-foreground text-base font-semibold">
											{run.route?.name ?? "Unknown route"}
										</Text>
										<Text className="text-muted-foreground mt-1 text-xs">
											{formatDate(run.startedAt)} at{" "}
											{formatTime(run.startedAt)}
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
						))
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
