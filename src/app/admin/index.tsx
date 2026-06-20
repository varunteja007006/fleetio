import { Stack, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AdminDashboard = () => {
	const router = useRouter();

	return (
		<SafeAreaView>
			<Stack.Screen options={{ headerShown: false }} />
			<Pressable
				onPress={() => router.push("/admin/route")}
				className="bg-secondary rounded-lg px-5 py-3"
			>
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
