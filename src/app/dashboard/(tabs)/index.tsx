import { api } from "@/convex/_generated/api";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 17) return "Good afternoon";
	return "Good evening";
}

function UserCardSkeleton() {
	return (
		<View className="bg-primary px-6 pb-14 pt-6">
			<View className="flex-row items-center gap-4">
				<View className="h-20 w-20 rounded-full bg-white/10" />
				<View className="flex-1 gap-2 py-1">
					<View className="h-3 w-24 rounded bg-white/10" />
					<View className="h-7 w-44 rounded bg-white/10" />
					<View className="h-5 w-16 rounded-md bg-white/10" />
				</View>
			</View>
		</View>
	);
}

function UserCard({
	profile,
}: {
	profile: {
		firstName?: string | null;
		lastName?: string | null;
		role?: string | null;
		avatarStorageId?: string | null;
	} | null;
}) {
	const avatarUrl = useQuery(
		api.profile.getStorageUrl,
		profile?.avatarStorageId ? { storageId: profile.avatarStorageId } : "skip",
	);
	const firstName = profile?.firstName ?? "";
	const lastName = profile?.lastName ?? "";
	const displayName = firstName ? `${firstName} ${lastName}`.trim() : "there";
	const role = profile?.role ?? "";
	const roleLabel = role === "new_user" ? "NEW" : role.toUpperCase();
	const initial = displayName === "there" ? "?" : displayName[0].toUpperCase();

	return (
		<View className="bg-primary px-6 pb-14 pt-6">
			<View className="flex-row items-center gap-4">
				{avatarUrl ? (
					<Image
						source={{ uri: avatarUrl }}
						className="h-20 w-20 rounded-full"
						resizeMode="cover"
					/>
				) : (
					<View className="h-20 w-20 items-center justify-center rounded-full bg-white/20">
						<Text className="text-primary-foreground text-2xl font-bold">
							{initial}
						</Text>
					</View>
				)}
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
	);
}

const Dashboard = () => {
	const router = useRouter();
	const userProfile = useQuery(api.profile.getUserProfile);
	const routeStats = useQuery(api.routes.routesStats);
	const allRoutes = useQuery(api.routes.list, {});
	const assignments = useQuery(api.routeAssignments.listByDriver);

	const role = userProfile?.role ?? "";
	const isAdminOrManager = role === "admin" || role === "manager";

	const totalRoutes = isAdminOrManager
		? (routeStats?.totalRoutes ?? 0)
		: (assignments?.length ?? 0);

	const routeCount = isAdminOrManager
		? (allRoutes?.length ?? 0)
		: (assignments?.filter((a) => a.active)?.length ?? 0);
	const activeRun = useQuery(api.routeRuns.getActiveRun);

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<SafeAreaView>
				<ScrollView showsVerticalScrollIndicator={false}>
					{userProfile === undefined ? (
						<UserCardSkeleton />
					) : (
						<UserCard profile={userProfile} />
					)}

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
							{!isAdminOrManager ? (
								<Pressable
									onPress={() => {
										if (activeRun) {
											router.push(
												`/dashboard/route/runs/${activeRun._id}`,
											);
										} else {
											router.push("/dashboard/(tabs)/routes");
										}
									}}
									className="flex-1 items-center rounded-2xl border border-border bg-card px-4 py-5 shadow-sm active:opacity-70"
								>
									<View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-chart-3/15">
										<Lucide
											name={activeRun ? "play" : "flag"}
											size={20}
											color="#c2410c"
										/>
									</View>
									<Text className="text-foreground text-sm font-medium">
										{activeRun ? "Continue" : "Start"}
									</Text>
								</Pressable>
							) : null}
							{!isAdminOrManager ? (
								<Pressable
									onPress={() => router.push("/dashboard/route-history")}
									className="flex-1 items-center rounded-2xl border border-border bg-card px-4 py-5 shadow-sm active:opacity-70"
								>
									<View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-chart-1/15">
										<Lucide name="clock" size={20} color="#f59e0b" />
									</View>
									<Text className="text-foreground text-sm font-medium">
										History
									</Text>
								</Pressable>
							) : null}
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

					{activeRun && activeRun.route ? (
						<View className="mx-6 mt-6">
							<Pressable
								onPress={() =>
									router.push(`/dashboard/route/runs/${activeRun._id}`)
								}
								className="flex-row items-center gap-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4"
							>
								<View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
									<Lucide name="play" size={20} color="#2563eb" />
								</View>
								<View className="flex-1 gap-0.5">
									<Text className="text-blue-700 text-sm font-semibold">
										Active Route: {activeRun.route.name}
									</Text>
									<Text className="text-blue-500 text-xs">Tap to continue</Text>
								</View>
								<Lucide name="arrow-right" size={20} color="#60a5fa" />
							</Pressable>
						</View>
					) : null}

					{userProfile !== undefined && !userProfile?.firstName && (
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
