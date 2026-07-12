import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Link, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

const Dashboard = () => {
	const userprofile = useQuery(api.profile.getUserProfile);
	const router = useRouter();

	const noFirstName =
		userprofile?.firstName === "" ||
		userprofile?.firstName === null ||
		userprofile?.firstName === undefined;

	return (
		<View className="flex-1 h-full justify-start p-4 gap-4">
			<View className="flex-row items-center justify-between">
				<Text className="text-3xl font-semibold">Dashboard</Text>
				<Link href="/" className="text-primary text-base font-medium">
					Home
				</Link>
			</View>

			{noFirstName && (
				<Pressable
					onPress={() => router.push("/dashboard/(tabs)/profile")}
					className="p-4 bg-red-100 border rounded-lg border-red-500"
				>
					<Text className="text-red-600 text-center">Complete profile</Text>
				</Pressable>
			)}
		</View>
	);
};

export default Dashboard;
