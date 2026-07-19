import { api } from "@/convex/_generated/api";
import Luicide from "@react-native-vector-icons/lucide";
import { usePaginatedQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	Image,
	Modal,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width;

const REQUEST_TYPE_LABELS: Record<string, string> = {
	feedback: "Feedback",
	feature_request: "Feature Request",
	bug: "Bug Report",
};

const REQUEST_TYPE_ICONS: Record<string, string> = {
	feedback: "message-circle",
	feature_request: "sparkles",
	bug: "bug",
};

const REQUEST_TYPE_COLORS: Record<string, string> = {
	feedback: "#3b82f6",
	feature_request: "#8b5cf6",
	bug: "#ef4444",
};

export default function AdminRequestsScreen() {
	const router = useRouter();
	const {
		results: allRequests,
		status: paginatedStatus,
		loadMore,
	} = usePaginatedQuery(
		api.requests.listAllRequests,
		{},
		{ initialNumItems: 5 },
	);
	const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ headerShown: false }} />

			<View className="flex-row items-center px-4 py-3">
				<Pressable onPress={() => router.back()} className="mr-3 p-1">
					<Luicide name="arrow-left" size={24} color="#9ca3af" />
				</Pressable>
				<Text className="text-foreground text-xl font-bold">
					All Requests
				</Text>
			</View>

			{paginatedStatus === "LoadingFirstPage" ? (
				<ActivityIndicator className="mt-8" />
			) : allRequests.length === 0 ? (
				<View className="flex-1 items-center justify-center px-6">
					<Luicide name="inbox" size={48} color="#9ca3af" />
					<Text className="text-muted-foreground mt-4 text-base">
						No requests yet.
					</Text>
				</View>
			) : (
				<ScrollView className="px-6 pb-8">
					<Text className="text-muted-foreground mb-4 text-sm">
						{allRequests.length} request{allRequests.length !== 1 ? "s" : ""}
					</Text>
					{allRequests.map((req) => (
						<View
							key={req._id}
							className={`border-border bg-card mb-3 rounded-xl border p-4 ${
								req.isDeleted ? "opacity-60" : ""
							}`}
						>
							<View className="mb-2 flex-row items-center gap-2">
								<Luicide
									name={
										REQUEST_TYPE_ICONS[req.type] as
											| "message-circle"
											| "sparkles"
											| "bug"
									}
									size={16}
									color={REQUEST_TYPE_COLORS[req.type]}
								/>
								<View
									className="rounded-full px-2.5 py-0.5"
									style={{
										backgroundColor:
											REQUEST_TYPE_COLORS[req.type] + "20",
									}}
								>
									<Text
										className="text-xs font-medium"
										style={{ color: REQUEST_TYPE_COLORS[req.type] }}
									>
										{REQUEST_TYPE_LABELS[req.type]}
									</Text>
								</View>
								{req.isDeleted && (
									<View className="rounded-full bg-red-500/20 px-2.5 py-0.5">
										<Text className="text-xs font-medium text-red-500">
											Deleted
										</Text>
									</View>
								)}
								<Text className="text-muted-foreground ml-auto text-xs">
									{new Date(req.createdAt).toLocaleDateString(undefined, {
										month: "short",
										day: "numeric",
										year: "numeric",
									})}
								</Text>
							</View>
							<Text className="text-foreground text-sm leading-5">
								{req.description}
							</Text>
							<View className="text-muted-foreground mt-1.5 flex-row items-center gap-1.5">
								<Luicide name="user" size={12} color="#9ca3af" />
								<Text className="text-muted-foreground text-xs">
									{req.user
										? [req.user.firstName, req.user.lastName]
												.filter(Boolean)
												.join(" ") || req.user.phoneNumber || req.user.email || "Unknown"
										: "Unknown User"}
								</Text>
							</View>
							{req.imageUrls && req.imageUrls.length > 0 && (
								<View className="mt-3 flex-row flex-wrap gap-2">
									{req.imageUrls.filter(Boolean).map((url, i) => (
										<Pressable
											key={i}
											onPress={() => setSelectedImageUrl(url!)}
										>
											<Image
												source={{ uri: url! }}
												className="rounded-xl border border-white/10"
												style={{ width: 64, height: 64 }}
											/>
										</Pressable>
									))}
								</View>
							)}
						</View>
					))}
					{paginatedStatus === "CanLoadMore" && (
						<Pressable
							onPress={() => loadMore(5)}
							className="border-border bg-card mb-4 items-center rounded-xl border border-dashed px-4 py-3 active:opacity-70"
						>
							<Text className="text-muted-foreground text-sm font-medium">
								Load More
							</Text>
						</Pressable>
					)}
					{paginatedStatus === "LoadingMore" && (
						<ActivityIndicator className="mb-4" />
					)}
				</ScrollView>
			)}

			<Modal
				visible={selectedImageUrl !== null}
				transparent
				animationType="fade"
				onRequestClose={() => setSelectedImageUrl(null)}
			>
				<View className="flex-1 bg-black/70">
					<View className="flex-1 items-center justify-center">
						<Pressable
							className="absolute right-6 top-16 z-10 h-9 w-9 items-center justify-center rounded-full bg-black/60"
							onPress={() => setSelectedImageUrl(null)}
						>
							<Luicide name="x" size={20} color="#ffffff" />
						</Pressable>
						<Pressable
							className="items-center justify-center"
							onPress={() => setSelectedImageUrl(null)}
						>
							{selectedImageUrl && (
								<Image
									source={{ uri: selectedImageUrl }}
									className="rounded-2xl"
									style={{
										width: screenWidth - 48,
										height: screenWidth - 48,
									}}
									resizeMode="contain"
								/>
							)}
						</Pressable>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}
