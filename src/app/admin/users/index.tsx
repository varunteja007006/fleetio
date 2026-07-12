import { api } from "@/convex/_generated/api";
import { usePaginatedQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Pending", value: "pending" },
	{ label: "Approved", value: "approved" },
	{ label: "Rejected", value: "rejected" },
];

const ROLE_BADGE: Record<string, string> = {
	admin: "bg-primary",
	manager: "bg-secondary",
	driver: "bg-muted",
	new_user: "bg-muted",
};

const ROLE_TEXT: Record<string, string> = {
	admin: "text-primary-foreground",
	manager: "text-secondary-foreground",
	driver: "text-muted-foreground",
	new_user: "text-muted-foreground",
};

const STATUS_BADGE: Record<string, string> = {
	approved: "bg-green-500",
	pending: "bg-amber-500",
	rejected: "bg-red-500",
};

const STATUS_TEXT: Record<string, string> = {
	approved: "text-white",
	pending: "text-white",
	rejected: "text-white",
};

export default function AdminUsersScreen() {
	const router = useRouter();
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [searchQuery, setSearchQuery] = useState("");

	const users = usePaginatedQuery(
		api.profile.allProfiles,
		{},
		{
			initialNumItems: 10,
		},
	);

	const isLoading =
		users === undefined || users.isLoading || users.results === undefined;

	const noMoreResults = users.status === "Exhausted";
	const hasMoreResults = users.status === "CanLoadMore";
	const loadingMoreResults = users.status === "LoadingMore";
	const loadingFirstPage = users.status === "LoadingFirstPage";

	const filteredUsers = useMemo(() => {
		if (!users.results) return [];

		let result = users.results;

		if (statusFilter !== "all") {
			result = result.filter((user) => user.status === statusFilter);
		}

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			result = result.filter((user) => {
				const name =
					`${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase();
				const phone = (user.phoneNumber ?? "").toLowerCase();
				const email = (user.email ?? "").toLowerCase();
				return (
					name.includes(query) ||
					phone.includes(query) ||
					email.includes(query)
				);
			});
		}

		return result;
	}, [users.results, statusFilter, searchQuery]);

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ headerShown: false }} />
			<ScrollView
				className="px-6 py-6"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text className="text-foreground text-2xl font-bold">Users</Text>
				<Text className="text-muted-foreground mt-1 text-sm">
					Manage your users here.
				</Text>

				{/* Search bar */}
				<View className="bg-card border-border mt-5 rounded-xl border px-4 py-3">
					<TextInput
						className="text-foreground"
						placeholder="Search by name, phone, or email..."
						placeholderTextColor="#9ca3af"
						value={searchQuery}
						onChangeText={setSearchQuery}
						autoCapitalize="none"
						autoCorrect={false}
						clearButtonMode="while-editing"
					/>
				</View>

				{/* Filter tabs */}
				<View className="mt-4 flex-row gap-2">
					{STATUS_TABS.map((tab) => (
						<Pressable
							key={tab.value}
							onPress={() => setStatusFilter(tab.value)}
							className={`rounded-lg px-4 py-2 ${
								statusFilter === tab.value
									? "bg-primary"
									: "bg-card border-border border"
							}`}
						>
							<Text
								className={`text-sm font-medium ${
									statusFilter === tab.value
										? "text-primary-foreground"
										: "text-muted-foreground"
								}`}
							>
								{tab.label}
							</Text>
						</Pressable>
					))}
				</View>

				{/* Users list */}
				<View className="mt-6 gap-3">
					<Text className="text-foreground text-lg font-semibold">
						{statusFilter === "all"
							? "All users"
							: `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} users`}
					</Text>

					{isLoading ? (
						<ActivityIndicator className="mt-4" />
					) : filteredUsers.length === 0 ? (
						<Text className="text-muted-foreground mt-4 text-center text-sm">
							No users found.
						</Text>
					) : (
						filteredUsers.map((user) => (
							<Pressable
								key={user._id}
								onPress={() => router.push(`/admin/users/${user._id}`)}
								className="bg-card border-border active:opacity-80 rounded-xl border p-4"
							>
								<View className="flex-row items-center justify-between">
									<View className="flex-1 pr-3">
										<Text className="text-foreground text-base font-semibold">
											{user.firstName || user.lastName
												? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
												: "Unnamed User"}
										</Text>
										{user.phoneNumber ? (
											<Text className="text-muted-foreground mt-0.5 text-sm">
												{user.phoneNumber}
											</Text>
										) : null}
										{user.email ? (
											<Text className="text-muted-foreground text-sm">
												{user.email}
											</Text>
										) : null}
									</View>
									<View className="items-end gap-1.5">
										<View
											className={`rounded-md px-2.5 py-0.5 ${
												ROLE_BADGE[user.role] ?? "bg-muted"
											}`}
										>
											<Text
												className={`text-xs font-medium capitalize ${
													ROLE_TEXT[user.role] ?? "text-muted-foreground"
												}`}
											>
												{user.role.replace("_", " ")}
											</Text>
										</View>
										<View
											className={`rounded-md px-2.5 py-0.5 ${
												STATUS_BADGE[user.status] ?? "bg-gray-500"
											}`}
										>
											<Text
												className={`text-xs font-medium capitalize ${
													STATUS_TEXT[user.status] ?? "text-white"
												}`}
											>
												{user.status}
											</Text>
										</View>
									</View>
								</View>
							</Pressable>
						))
					)}
				</View>

				{/* Load more */}
				{!isLoading && hasMoreResults && (
					<Pressable
						onPress={() => users.loadMore(10)}
						disabled={loadingMoreResults}
						className="bg-card border-border mt-4 rounded-xl border py-3 active:opacity-80"
					>
						{loadingMoreResults ? (
							<ActivityIndicator />
						) : (
							<Text className="text-foreground text-center font-medium">
								Load more
							</Text>
						)}
					</Pressable>
				)}

				{noMoreResults && filteredUsers.length > 0 && (
					<Text className="text-muted-foreground mt-4 text-center text-sm">
						All users loaded.
					</Text>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
