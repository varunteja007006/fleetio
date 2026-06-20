import { Lucide } from "@react-native-vector-icons/lucide";
import { Tabs } from "expo-router";

const TabLayout = () => {
	return (
		<Tabs screenOptions={{ headerShown: false }}>
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
	);
};

export default TabLayout;
