import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Luicide from "@react-native-vector-icons/lucide";
import { useMutation, usePaginatedQuery } from "convex/react";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	Image,
	Modal,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width;

const REQUEST_TYPES = [
	{
		value: "feedback",
		label: "Feedback",
		icon: "message-circle" as const,
		color: "#3b82f6",
	},
	{
		value: "feature_request",
		label: "Feature Request",
		icon: "sparkles" as const,
		color: "#8b5cf6",
	},
	{ value: "bug", label: "Bug Report", icon: "bug" as const, color: "#ef4444" },
] as const;

type RequestType = (typeof REQUEST_TYPES)[number]["value"];

const MAX_IMAGES = 5;

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

export default function SubmitRequestScreen() {
	const router = useRouter();
	const submitRequest = useMutation(api.requests.submitRequest);
	const getUploadUrl = useMutation(api.requests.getUploadUrl);
	const softDeleteRequest = useMutation(api.requests.softDeleteRequest);
	const {
		results: paginatedRequests,
		status: paginatedStatus,
		loadMore,
	} = usePaginatedQuery(
		api.requests.listMyRequests,
		{},
		{ initialNumItems: 5 },
	);

	const [requestType, setRequestType] = useState<RequestType | null>(null);
	const [description, setDescription] = useState("");
	const [images, setImages] = useState<{ uri: string }[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

	const canSubmit = requestType !== null && description.trim().length >= 10;

	const pickImages = async () => {
		const remaining = MAX_IMAGES - images.length;
		if (remaining <= 0) return;

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsMultipleSelection: true,
			selectionLimit: remaining,
			quality: 0.7,
		});

		if (result.canceled) return;

		const newImages = result.assets.map((asset) => ({
			uri: asset.uri,
		}));

		setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
	};

	const removeImage = (index: number) => {
		setImages((prev) => prev.filter((_, i) => i !== index));
	};

	const uploadImage = async (uri: string): Promise<string> => {
		const uploadUrl = await getUploadUrl();

		const ext = uri.split(".").pop()?.toLowerCase();
		const mimeType =
			ext === "png"
				? "image/png"
				: ext === "gif"
					? "image/gif"
					: ext === "webp"
						? "image/webp"
						: "image/jpeg";

		const result = await FileSystem.uploadAsync(uploadUrl, uri, {
			httpMethod: "POST",
			uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
			headers: { "Content-Type": mimeType },
		});

		const { storageId } = JSON.parse(result.body);
		return storageId as string;
	};

	const handleDeleteRequest = (requestId: Id<"requests">) => {
		Alert.alert(
			"Delete Request",
			"Are you sure you want to delete this request? It will be hidden from your view but admins can still see it.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							await softDeleteRequest({ requestId });
						} catch (error) {
							Alert.alert(
								"Failed to delete",
								error instanceof Error ? error.message : "Please try again.",
							);
						}
					},
				},
			],
		);
	};

	const handleSubmit = async () => {
		if (!canSubmit || !requestType) return;
		setIsSubmitting(true);

		try {
			const imageStorageIds: string[] = [];
			for (const img of images) {
				const storageId = await uploadImage(img.uri);
				imageStorageIds.push(storageId);
			}

			await submitRequest({
				type: requestType,
				description: description.trim(),
				imageStorageIds,
			});

			Alert.alert(
				"Request submitted",
				"Thank you for your feedback! We'll review it shortly.",
				[{ text: "OK", onPress: () => router.back() }],
			);
		} catch (error) {
			Alert.alert(
				"Failed to submit",
				error instanceof Error ? error.message : "Please try again.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ headerShown: false }} />

			<View className="flex-row items-center px-4 py-3">
				<Pressable onPress={() => router.back()} className="mr-3 p-1">
					<Luicide name="arrow-left" size={24} color="#9ca3af" />
				</Pressable>
				<Text className="text-foreground text-xl font-bold">
					Submit a Request
				</Text>
			</View>

			<ScrollView className="px-6 pb-8">
				<Text className="text-muted-foreground mb-6 mt-2 text-sm">
					Select a request type and describe what's on your mind.
				</Text>

				<Text className="text-foreground mb-3 text-sm font-medium">
					Request Type
				</Text>
				<View className="mb-6 flex-row gap-3">
					{REQUEST_TYPES.map((type) => {
						const isSelected = requestType === type.value;

						return (
							<Pressable
								key={type.value}
								onPress={() => setRequestType(type.value)}
								disabled={isSubmitting}
								className={`flex-1 items-center rounded-xl border p-3 ${
									isSelected ? "border-2" : "border-border"
								}`}
								style={{
									borderColor: isSelected ? type.color : undefined,
									backgroundColor: isSelected ? type.color + "15" : undefined,
								}}
							>
								<Luicide
									name={type.icon}
									size={22}
									color={isSelected ? type.color : "#9ca3af"}
								/>
								<Text
									className={`mt-1.5 text-center text-xs font-medium ${
										isSelected ? "text-foreground" : "text-muted-foreground"
									}`}
								>
									{type.label}
								</Text>
							</Pressable>
						);
					})}
				</View>

				<Text className="text-foreground mb-2 text-sm font-medium">
					Description
				</Text>
				<TextInput
					value={description}
					onChangeText={setDescription}
					placeholder="Describe your request in detail..."
					placeholderTextColor="#6b7280"
					multiline
					numberOfLines={6}
					textAlignVertical="top"
					editable={!isSubmitting}
					className="border-border bg-card text-foreground rounded-xl border px-4 py-3 text-base"
					style={{ minHeight: 140 }}
				/>
				<Text className="text-muted-foreground mt-1.5 text-xs">
					{description.trim().length}/10 characters minimum
				</Text>

				<Text className="text-foreground mb-3 mt-6 text-sm font-medium">
					Attachments ({images.length}/{MAX_IMAGES})
				</Text>

				{images.length > 0 && (
					<View className="mb-3 flex-row flex-wrap gap-2">
						{images.map((img, i) => (
							<View key={i} className="relative">
								<Image
									source={{ uri: img.uri }}
									className="rounded-xl"
									style={{ width: 80, height: 80 }}
								/>
								<Pressable
									onPress={() => removeImage(i)}
									className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-black/60"
									disabled={isSubmitting}
								>
									<Luicide name="x" size={14} color="#ffffff" />
								</Pressable>
							</View>
						))}
					</View>
				)}

				{images.length < MAX_IMAGES && (
					<Pressable
						onPress={pickImages}
						disabled={isSubmitting}
						className="border-border bg-card mb-6 items-center rounded-xl border border-dashed px-4 py-6 active:opacity-70"
					>
						<Luicide name="image-plus" size={28} color="#9ca3af" />
						<Text className="text-muted-foreground mt-2 text-sm">
							Tap to add images
						</Text>
					</Pressable>
				)}

				<Pressable
					onPress={handleSubmit}
					disabled={!canSubmit || isSubmitting}
					className={`rounded-xl py-3.5 ${
						canSubmit && !isSubmitting
							? "bg-primary active:opacity-80"
							: "bg-gray-500/30"
					}`}
				>
					{isSubmitting ? (
						<ActivityIndicator color="#ffffff" />
					) : (
						<Text className="text-center text-base font-semibold text-white">
							Submit Request
						</Text>
					)}
				</Pressable>

				{paginatedStatus === "LoadingFirstPage" ? (
					<ActivityIndicator className="mt-8" />
				) : paginatedRequests.length > 0 ? (
					<View className="mt-8">
						<Text className="text-foreground mb-4 text-lg font-bold">
							Submitted Requests
						</Text>
						{paginatedRequests.map((req) => (
							<View
								key={req._id}
								className="border-border bg-card mb-3 rounded-xl border p-4"
							>
								<View className="mb-2 flex-row items-center gap-2">
									<Luicide
										name={
											REQUEST_TYPE_ICONS[req.type] as "message-circle" | "sparkles" | "bug"
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
									<Text className="text-muted-foreground ml-auto text-xs">
										{new Date(req.createdAt).toLocaleDateString(undefined, {
											month: "short",
											day: "numeric",
											year: "numeric",
										})}
									</Text>
									<Pressable
										onPress={() =>
											handleDeleteRequest(req._id as Id<"requests">)
										}
										className="ml-2 p-1"
									>
										<Luicide name="trash-2" size={16} color="#ef4444" />
									</Pressable>
								</View>
								<Text
									className="text-foreground text-sm leading-5"
									numberOfLines={3}
								>
									{req.description}
								</Text>
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
					</View>
				) : null}
			</ScrollView>

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
