import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function Index() {
	const tasks = useQuery(api.tasks.get);
	const router = useRouter();
	return (
		<View style={styles.container}>
			{tasks?.map(({ _id, text }) => (
				<Text key={_id}>{text}</Text>
			))}
			<Button title="Go to Auth" onPress={() => router.push("/auth")} />
			<Button title="Go to Profile" onPress={() => router.push("/profile")} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});
