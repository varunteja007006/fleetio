import { api } from "@/convex/_generated/api";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "convex/react";
import { Link, Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 17) return "Good afternoon";
	return "Good evening";
}

const Dashboard = () => {
	const router = useRouter();
	const userProfile = useQuery(api.profile.getUserProfile);
	const routeStats = useQuery(api.routes.routesStats);
	const routes = useQuery(api.routes.list, {});

	const totalRoutes = routeStats?.totalRoutes ?? 0;
	const routeCount = routes?.length ?? 0;
	const firstName = userProfile?.firstName ?? "";
	const lastName = userProfile?.lastName ?? "";
	const displayName = firstName ? `${firstName} ${lastName}`.trim() : "there";
	const role = userProfile?.role ?? "";
	const roleLabel = role === "new_user" ? "NEW" : role.toUpperCase();
	const initial = displayName === "there" ? "?" : displayName[0].toUpperCase();
	const noFirstName = !firstName;

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<SafeAreaView>
				<ScrollView showsVerticalScrollIndicator={false}>
					<View className="bg-primary px-6 pb-14 pt-6">
						<View className="flex-row items-center gap-4">
							<View className="h-14 w-14 items-center justify-center rounded-full bg-white/20">
								<Text className="text-primary-foreground text-xl font-bold">
									{initial}
								</Text>
							</View>
							<View className="flex-1 gap-1">
								<Text className="text-primary-foreground/70 text-sm">
									{getGreeting()},
								</Text>
								<Text
									className="text-primary-foreground text-2xl font-bold"
									numberOfLines={1}
								>
									{displayName}
								</Text>
								<View className="flex-row items-center gap-2">
									<View className="rounded-md bg-white/20 px-2.5 py-0.5">
										<Text className="text-primary-foreground text-xs font-semibold">
											{roleLabel}
										</Text>
									</View>
								</View>
							</View>
						</View>
					</View>

					<View className="-mt-8 flex-row gap-3 px-6">
						<View className="flex-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
							<View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-chart-1/15">
								<Lucide name="route" size={20} color="#f59e0b" />
							</View>
							<Text className="text-foreground text-2xl font-bold">
								{totalRoutes}
							</Text>
							<Text className="text-muted-foreground text-xs">
								Total Routes
							</Text>
						</View>
						<View className="flex-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
							<View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-chart-2/15">
								<Lucide name="activity" size={20} color="#ea580c" />
							</View>
							<Text className="text-foreground text-2xl font-bold">
								{routeCount}
							</Text>
							<Text className="text-muted-foreground text-xs">
								Active Routes
							</Text>
						</View>
					</View>

					<View className="mt-8 px-6">
						<Text className="text-foreground mb-4 text-lg font-semibold">
							Quick Actions
						</Text>
						<View className="flex-row gap-3">
							<Pressable
								onPress={() => router.push("/dashboard/(tabs)/routes")}
								className="flex-1 items-center rounded-2xl border border-border bg-card px-4 py-5 shadow-sm active:opacity-70"
							>
								<View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-chart-1/15">
									<Lucide name="navigation" size={20} color="#f59e0b" />
								</View>
								<Text className="text-foreground text-sm font-medium">
									Routes
								</Text>
							</Pressable>
							<Pressable
								onPress={() => router.push("/dashboard/edit-profile")}
								className="flex-1 items-center rounded-2xl border border-border bg-card px-4 py-5 shadow-sm active:opacity-70"
							>
								<View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-chart-2/15">
									<Lucide name="pencil" size={20} color="#ea580c" />
								</View>
								<Text className="text-foreground text-sm font-medium">
									Profile
								</Text>
							</Pressable>
							{role === "admin" && (
								<Pressable
									onPress={() => router.push("/admin")}
									className="flex-1 items-center rounded-2xl border border-border bg-card px-4 py-5 shadow-sm active:opacity-70"
								>
									<View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-chart-3/15">
										<Lucide name="shield" size={20} color="#c2410c" />
									</View>
									<Text className="text-foreground text-sm font-medium">
										Admin
									</Text>
								</Pressable>
							)}
						</View>
					</View>

					{routes && routes.length > 0 && (
						<View className="mt-8 px-6">
							<View className="mb-4 flex-row items-center justify-between">
								<Text className="text-foreground text-lg font-semibold">
									Routes
								</Text>
								<Link
									href="/dashboard/(tabs)/routes"
									className="text-primary text-sm font-medium"
								>
									See all
								</Link>
							</View>
							{routes.slice(0, 5).map((route) => (
								<Pressable
									key={route._id}
									onPress={() => router.push("/dashboard/(tabs)/routes")}
									className="mb-2 flex-row items-center rounded-2xl border border-border bg-card px-4 py-4 shadow-sm active:opacity-70"
								>
									<View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
										<Lucide name="map-pin" size={18} color="#f59e0b" />
									</View>
									<View className="flex-1 gap-0.5">
										<Text className="text-foreground text-base font-medium">
											{route.name}
										</Text>
										{route.description && (
											<Text
												className="text-muted-foreground text-sm"
												numberOfLines={1}
											>
												{route.description}
											</Text>
										)}
									</View>
									<Lucide name="chevron-right" size={18} color="#9ca3af" />
								</Pressable>
							))}
						</View>
					)}

					{routes && routes.length === 0 && (
						<View className="mx-6 mt-8 items-center rounded-2xl border border-dashed border-border bg-card px-6 py-12">
							<View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-muted">
								<Lucide name="route" size={28} color="#9ca3af" />
							</View>
							<Text className="text-foreground mb-1 text-base font-semibold">
								No routes yet
							</Text>
							<Text className="text-muted-foreground text-center text-sm">
								Routes will appear here once they are created
							</Text>
						</View>
					)}

					{noFirstName && (
						<Pressable
							onPress={() => router.push("/dashboard/(tabs)/profile")}
							className="mx-6 mt-6 flex-row items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4"
						>
							<View className="h-10 w-10 items-center justify-center rounded-xl bg-red-100">
								<Lucide name="alert-triangle" size={20} color="#dc2626" />
							</View>
							<View className="flex-1 gap-0.5">
								<Text className="text-red-700 text-sm font-semibold">
									Complete your profile
								</Text>
								<Text className="text-red-500 text-xs">
									Add your name and details to get started
								</Text>
							</View>
							<Lucide name="arrow-right" size={20} color="#f87171" />
						</Pressable>
					)}

					<View className="h-8" />
				</ScrollView>
			</SafeAreaView>
		</>
	);
};

export default Dashboard;
