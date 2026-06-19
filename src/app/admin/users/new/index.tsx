import {
  Text,
  View
} from "react-native";

export default function AdminNewUserScreen() {
	return (
		<View className="p-4">
			<Text className="text-foreground text-lg font-semibold">
				Add New User
			</Text>
			<Text className="text-muted-foreground mt-1 text-sm">
				Create a new user account.
			</Text>
		</View>
	);
}
