import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
	const tasks = useQuery(api.tasks.get);
	return (
		<View style={styles.container}>
			{tasks?.map(({ _id, text }) => (
				<Text key={_id}>{text}</Text>
			))}
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
