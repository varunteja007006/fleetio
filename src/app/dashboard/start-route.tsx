import { api } from "@/convex/_generated/api";
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

export default function StartRouteScreen() {
	const router = useRouter();
	const myAssignments = useQuery(api.routeAssignments.listByDriver);
	const startRouteRun = useMutation(api.routeRuns.startRouteRun);
	const [startingRouteId, setStartingRouteId] = useState<string | null>(null);

	const assignedRoutes =
		myAssignments
			?.filter((a) => a.active && a.route && !a.route.isDeleted)
			.map((a) => a.route) ?? [];

	const handleStartRoute = async (routeId: string) => {
		setStartingRouteId(routeId);
		try {
			const runId = await startRouteRun({ routeId });
			router.replace(`/dashboard/active-run?runId=${runId}`);
		} catch (error) {
			Alert.alert(
				"Failed to start route",
				error instanceof Error ? error.message : "Please try again.",
			);
		} finally {
			setStartingRouteId(null);
		}
	};

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ title: "Start Route" }} />
			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text className="text-foreground text-2xl font-bold">Start Route</Text>
				<Text className="text-muted-foreground mt-1 text-sm">
					Select an assigned route to begin.
				</Text>

				<View className="mt-6 gap-3">
					{myAssignments === undefined ? (
						<ActivityIndicator />
					) : assignedRoutes.length === 0 ? (
						<View className="items-center rounded-2xl border border-dashed border-border bg-card px-6 py-12">
							<Text className="text-foreground mb-1 text-base font-semibold">
								No routes assigned
							</Text>
							<Text className="text-muted-foreground text-center text-sm">
								You haven&apos;t been assigned any routes yet.
							</Text>
						</View>
					) : (
						assignedRoutes.map((route) => {
							const isLoading = startingRouteId === route._id;

							return (
								<View
									key={route._id}
									className="bg-card border-border rounded-xl border p-4"
								>
									<Text className="text-foreground text-base font-semibold">
										{route.name}
									</Text>
									{route.description ? (
										<Text className="text-muted-foreground mt-1 text-sm">
											{route.description}
										</Text>
									) : null}
									<Pressable
										onPress={() => handleStartRoute(route._id)}
										disabled={isLoading}
										className={`bg-primary mt-4 rounded-lg py-2.5 ${
											isLoading ? "opacity-60" : "active:opacity-80"
										}`}
									>
										{isLoading ? (
											<ActivityIndicator color="#ffffff" />
										) : (
											<Text className="text-primary-foreground text-center font-semibold">
												Start Route
											</Text>
										)}
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
