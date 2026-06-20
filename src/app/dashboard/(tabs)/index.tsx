import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

const Dashboard = () => {
	const userprofile = useQuery(api.profile.getUserProfile);
	const router = useRouter();

	const noFirstName =
		userprofile?.firstName === "" ||
		userprofile?.firstName === null ||
		userprofile?.firstName === undefined;

	// Alert.alert(
	// 	"Complete your profile",
	// 	"Welcome to Fleetio!, but first you will have to complete your profile.",
	// 	[{ text: "OK",  }],
	// );

	return (
		<View className="flex-1 h-full justify-start p-4 gap-4">
			<Text className="text-3xl font-semibold">Dashboard</Text>

			<Pressable
				onPress={() => router.push("/dashboard/(tabs)/profile")}
				className="p-4 bg-red-100 border rounded-lg border-red-500"
			>
				<Text className="text-red-600 text-center">Complete profile</Text>
			</Pressable>
		</View>
	);
};

export default Dashboard;
