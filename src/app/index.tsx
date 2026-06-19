import { api } from "@/convex/_generated/api";
import { Button, Column, Host } from "@expo/ui";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";

export default function Index() {
	const isAdmin = useQuery(api.profile.getIsAdminProfile);
	const router = useRouter();
	return (
		// <View style={styles.container}>
		// 	<Button  />
		// 	<Button title="Go to Profile" onPress={() => router.push("/profile")} />
		// 	<Button
		// 		title="Go to Admin Route"
		// 		onPress={() => router.push("/admin/route")}
		// 	/>
		// </View>
		<Host matchContents>
			<Column spacing={8}>
				<Button
					variant="filled"
					label="Go to Auth"
					onPress={() => router.push("/auth")}
				/>

				<Button
					variant="outlined"
					label="Go to Profile"
					onPress={() => router.push("/profile")}
				/>
				{isAdmin && (
					<>
						<Button
							variant="text"
							label="Go to Admin Route"
							onPress={() => router.push("/admin/route")}
						/>
						<Button
							variant="filled"
							label="Go to Admin Users"
							onPress={() => router.push("/admin/users")}
						/>
					</>
				)}
			</Column>
		</Host>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		gap: 10,
	},
});
