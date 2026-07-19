import { api } from "@/convex/_generated/api";
import Luicide from "@react-native-vector-icons/lucide";
import { useMutation } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContactSupportScreen() {
	const router = useRouter();
	const submitMessage = useMutation(api.help.submitContactMessage);
	const [subject, setSubject] = useState("");
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const canSubmit = subject.trim().length > 0 && message.trim().length > 0;

	const handleSubmit = async () => {
		if (!canSubmit) return;

		setIsSubmitting(true);
		try {
			await submitMessage({ subject: subject.trim(), message: message.trim() });
			Alert.alert("Message sent", "We'll get back to you as soon as possible.", [
				{ text: "OK", onPress: () => router.back() },
			]);
		} catch (error) {
			Alert.alert(
				"Failed to send",
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

			<ScrollView className="flex-1 px-6 pb-8">
				<Text className="text-muted-foreground mb-6 mt-2 text-sm">
					Fill out the form below and our team will get back to you.
				</Text>

				<View className="mb-4">
					<Text className="text-foreground mb-2 text-sm font-medium">
						Subject
					</Text>
					<TextInput
						value={subject}
						onChangeText={setSubject}
						placeholder="What is this about?"
						placeholderTextColor="#6b7280"
						editable={!isSubmitting}
						className="border-border bg-card text-foreground rounded-xl border px-4 py-3 text-base"
					/>
				</View>

				<View className="mb-6">
					<Text className="text-foreground mb-2 text-sm font-medium">
						Message
					</Text>
					<TextInput
						value={message}
						onChangeText={setMessage}
						placeholder="Describe your issue or question..."
						placeholderTextColor="#6b7280"
						multiline
						numberOfLines={6}
						textAlignVertical="top"
						editable={!isSubmitting}
						className="border-border bg-card text-foreground rounded-xl border px-4 py-3 text-base"
						style={{ minHeight: 140 }}
					/>
				</View>

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
							Send Message
						</Text>
					)}
				</Pressable>
			</ScrollView>
		</SafeAreaView>
	);
}
