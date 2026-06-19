import { api } from "@/convex/_generated/api";
import { Button, Column, Host, List, ListItem } from "@expo/ui";
import { usePaginatedQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Text } from "react-native";

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
		<Host>
			<Column spacing={12}>
				<Text className="text-foreground text-lg font-semibold">Users</Text>
				<Text className="text-muted-foreground mt-1 text-sm">
					Manage your users here.
				</Text>

				<Button
					onPress={() => router.push("/admin/users/new")}
					label="Add New User"
				/>

				<List>
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
							<ListItem
								key={user._id}
								onPress={() => router.push(`/admin/users/${user._id}`)}
							>
								{user.firstName || "Unnamed User"}
								{user.email || "No email"}
							</ListItem>
						))
					)}
				</List>
			</Column>
		</Host>
	);
}
