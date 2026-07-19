import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AdminDashboard = () => {
	const router = useRouter();
	const routeStats = useQuery(api.routes.routesStats);
	const pendingProfiles = useQuery(api.profile.getPendingProfiles);

	const { totalRoutes } = routeStats ?? { totalRoutes: 0 };
	const pendingCount = pendingProfiles?.length ?? 0;

	const stats = [
		{ label: "Total Routes", value: totalRoutes, accent: "bg-blue-500" },
		{ label: "Pending Approvals", value: pendingCount, accent: "bg-amber-500" },
	];

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ headerShown: false }} />
			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text className="text-foreground text-2xl font-bold">Admin Dashboard</Text>
				<Text className="text-muted-foreground mt-1 text-sm">
					Overview of your fleet management system.
				</Text>

				{routeStats === undefined && pendingProfiles === undefined ? (
					<ActivityIndicator className="mt-8" />
				) : (
					<View className="mt-5 flex-row gap-3">
						{stats.map((stat) => (
							<View
								key={stat.label}
								className="bg-card border-border flex-1 rounded-xl border p-4"
							>
								<View
									className={`${stat.accent} mb-3 h-1.5 w-8 rounded-full`}
								/>
								<Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
									{stat.label}
								</Text>
								<Text className="text-foreground mt-1.5 text-3xl font-bold">
									{stat.value}
								</Text>
							</View>
						))}
					</View>
				)}

				<Text className="text-foreground mt-8 mb-3 text-lg font-semibold">
					Quick actions
				</Text>

				<Pressable
					onPress={() => router.push("/admin/route")}
					className="bg-card border-border active:opacity-80 rounded-xl border p-4"
				>
					<View className="flex-row items-center justify-between">
						<View className="flex-1 pr-4">
							<Text className="text-foreground text-base font-semibold">
								Manage Routes
							</Text>
							<Text className="text-muted-foreground mt-1 text-sm leading-5">
								Create, edit, and archive route table entries for your fleet.
							</Text>
						</View>
						<View className="bg-primary rounded-lg px-3 py-1.5">
							<Text className="text-primary-foreground text-sm font-medium">
								Open
							</Text>
						</View>
					</View>
				</Pressable>

				<Pressable
					onPress={() => router.push("/admin/users")}
					className="bg-card border-border active:opacity-80 mt-3 rounded-xl border p-4"
				>
					<View className="flex-row items-center justify-between">
						<View className="flex-1 pr-4">
							<Text className="text-foreground text-base font-semibold">
								Manage Users
							</Text>
							<Text className="text-muted-foreground mt-1 text-sm leading-5">
								Approve, reject, and manage roles for drivers and staff.
							</Text>
						</View>
						<View className="bg-primary rounded-lg px-3 py-1.5">
							<Text className="text-primary-foreground text-sm font-medium">
								Open
							</Text>
						</View>
					</View>
				</Pressable>

				<Pressable
					onPress={() => router.push("/admin/assignments")}
					className="bg-card border-border active:opacity-80 mt-3 rounded-xl border p-4"
				>
					<View className="flex-row items-center justify-between">
						<View className="flex-1 pr-4">
							<Text className="text-foreground text-base font-semibold">
								Route Assignments
							</Text>
							<Text className="text-muted-foreground mt-1 text-sm leading-5">
								Assign routes to drivers and manage existing assignments.
							</Text>
						</View>
						<View className="bg-primary rounded-lg px-3 py-1.5">
							<Text className="text-primary-foreground text-sm font-medium">
								Open
							</Text>
						</View>
					</View>
				</Pressable>

				<Pressable
					onPress={() => router.push("/admin/requests")}
					className="bg-card border-border active:opacity-80 mt-3 rounded-xl border p-4"
				>
					<View className="flex-row items-center justify-between">
						<View className="flex-1 pr-4">
							<Text className="text-foreground text-base font-semibold">
								View Requests
							</Text>
							<Text className="text-muted-foreground mt-1 text-sm leading-5">
								Review submitted feedback, feature requests, and bug reports.
							</Text>
						</View>
						<View className="bg-primary rounded-lg px-3 py-1.5">
							<Text className="text-primary-foreground text-sm font-medium">
								Open
							</Text>
						</View>
					</View>
				</Pressable>
			</ScrollView>
		</SafeAreaView>
	);
};

export default AdminDashboard;
