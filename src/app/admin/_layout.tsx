import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthGuard } from "~/hooks/use-auth-guard";

export default function AdminLayout() {
	const { isLoading, isAdmin } = useAuthGuard({ requireAdmin: true });

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center">
				<ActivityIndicator size="large" />
			</View>
		);
	}

	if (!isAdmin) {
		return null;
	}

	return (
		<>
			<Stack.Screen options={{ title: "Edit Route", headerShown: false }} />
			<Stack />
		</>
	);
}
