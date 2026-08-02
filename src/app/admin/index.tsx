import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Stack, useRouter, type Href } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminCard from "~/components/admin-card";

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

	const actions: {
		title: string;
		description: string;
		accent: string;
		href: Href;
	}[] = [
		{
			title: "Manage Routes",
			description: "Create, edit, and archive route table entries for your fleet.",
			accent: "bg-blue-500",
			href: "/admin/route",
		},
		{
			title: "Manage Vehicles",
			description: "Add fleet vehicles and configure GPS provider connections.",
			accent: "bg-emerald-500",
			href: "/admin/vehicles",
		},
		{
			title: "Live Locations",
			description: "View live vehicle positions grouped by vendor.",
			accent: "bg-lime-500",
			href: "/dashboard/live-locations",
		},
		{
			title: "Geofences",
			description: "Create circular geofence zones with configurable radius.",
			accent: "bg-violet-500",
			href: "/admin/geofences",
		},
		{
			title: "Manage Users",
			description: "Approve, reject, and manage roles for drivers and staff.",
			accent: "bg-amber-500",
			href: "/admin/users",
		},
		{
			title: "Route Assignments",
			description: "Assign routes to drivers and manage existing assignments.",
			accent: "bg-cyan-500",
			href: "/admin/assignments",
		},
		{
			title: "View Requests",
			description: "Review submitted feedback, feature requests, and bug reports.",
			accent: "bg-rose-500",
			href: "/admin/requests",
		},
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

				{actions.map((action, index) => (
					<AdminCard
						key={action.title}
						title={action.title}
						description={action.description}
						accent={action.accent}
						onPress={() => router.push(action.href)}
						className={index === 0 ? "" : "mt-3"}
					/>
				))}
			</ScrollView>
		</SafeAreaView>
	);
};

export default AdminDashboard;
