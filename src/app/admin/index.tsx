// import { Text } from "@/components/ui/text";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AdminDashboard = () => {
	const router = useRouter();
	const routeStats = useQuery(api.routes.routesStats);

	const { totalRoutes } = routeStats ?? { totalRoutes: 0 };

	return (
		<SafeAreaView>
			<Stack.Screen options={{ headerShown: false }} />
			<View className="bg-primary p-4">
				<Text className="text-xl font-semibold">Admin Dashboard</Text>
			</View>
			<Pressable
				onPress={() => router.push("/admin/route")}
				className="bg-secondary rounded-lg px-5 py-3"
			>
				{/* <Card className="w-50">
					<CardContent>
						<Text>Routes</Text>
						<Text>{totalRoutes}</Text>
					</CardContent>
				</Card> */}

				<Text className="text-secondary-foreground text-center font-semibold">
					Go to Admin Route
				</Text>
			</Pressable>
			<Pressable
				onPress={() => router.push("/admin/users")}
				className="bg-secondary rounded-lg px-5 py-3"
			>
				<Text className="text-secondary-foreground text-center font-semibold">
					Go to Admin Users
				</Text>
			</Pressable>
		</SafeAreaView>
	);
};

export default AdminDashboard;
