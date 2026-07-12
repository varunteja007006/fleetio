import { Lucide } from "@react-native-vector-icons/lucide";
import { Stack, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthGuard } from "~/hooks/use-auth-guard";

const TabLayout = () => {
	const { isLoading, isAuthenticated } = useAuthGuard();

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center">
				<ActivityIndicator size="large" />
			</View>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />

			<Tabs screenOptions={{ headerShown: true }}>
				<Tabs.Screen
					name="index"
					options={{
						title: "Dashboard",
						tabBarIcon: ({ color, size }) => (
							<Lucide name="home" size={size} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="routes"
					options={{
						title: "Routes",
						tabBarIcon: ({ color, size }) => (
							<Lucide name="route" size={size} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="profile"
					options={{
						title: "Profile",
						tabBarIcon: (props) => <Lucide name="circle-user" {...props} />,
					}}
				/>
			</Tabs>
		</>
	);
};

export default TabLayout;
