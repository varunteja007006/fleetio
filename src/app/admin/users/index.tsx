import { api } from "@/convex/_generated/api";
import { usePaginatedQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { Button, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminUsersScreen() {
	const router = useRouter();

	const users = usePaginatedQuery(
		api.profile.allProfiles,
		{},
		{
			initialNumItems: 10,
		},
	);

	let isLoading =
		users === undefined || users.isLoading || users.results === undefined;

	const noMoreResults = users.status === "Exhausted";
	const hasMoreResults = users.status === "CanLoadMore";
	const loadingMoreResults = users.status === "LoadingMore";

	const loadingFirstPage = users.status === "LoadingFirstPage";

	return (
		<SafeAreaView>
			<Stack.Screen options={{ headerShown: false }} />
			<View>
				<View>
					<Text className="text-foreground text-lg font-semibold">Users</Text>
					<Text className="text-muted-foreground mt-1 text-sm">
						Manage your users here.
					</Text>

					<Button
						onPress={() => router.push("/admin/users/new")}
						title="Add New User"
					/>

					<View>
						{/* Render user list here */}
						{isLoading ? (
							<Text className="text-muted-foreground text-sm text-center mt-4">
								Loading users...
							</Text>
						) : users.results.length === 0 ? (
							<Text className="text-muted-foreground text-sm text-center mt-4">
								No users found. Add your first user using the button above.
							</Text>
						) : (
							users.results.map((user) => (
								<Text
									key={user._id}
									onPress={() => router.push(`/admin/users/${user._id}`)}
								>
									{user.firstName || "Unnamed User"}
									{user.email || "No email"}
								</Text>
							))
						)}
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}
