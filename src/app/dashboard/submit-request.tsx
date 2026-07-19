import { api } from "@/convex/_generated/api";
import Luicide from "@react-native-vector-icons/lucide";
import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function SubmitRequestScreen() {
	const router = useRouter();
	const submitRequest = useMutation(api.requests.submitRequest);
	const getUploadUrl = useMutation(api.requests.getUploadUrl);

	const [requestType, setRequestType] = useState<RequestType | null>(null);
	const [description, setDescription] = useState("");
	const [images, setImages] = useState<{ uri: string }[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

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

		const response = await fetch(uri);
		const blob = await response.blob();

		const uploadResponse = await fetch(uploadUrl, {
			method: "POST",
			headers: { "Content-Type": blob.type || "image/jpeg" },
			body: blob,
		});

		if (!uploadResponse.ok) {
			const text = await uploadResponse.text();
			throw new Error(`Upload failed: ${text}`);
		}

		const { storageId } = await uploadResponse.json();
		return storageId as string;
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
			</ScrollView>
		</SafeAreaView>
	);
}
