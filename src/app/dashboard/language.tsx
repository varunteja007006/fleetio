import { api } from "@/convex/_generated/api";
import Luicide from "@react-native-vector-icons/lucide";
import { useMutation, useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LANGUAGES = [
	{ code: "en", label: "English", native: "English" },
] as const;

export default function LanguageScreen() {
	const router = useRouter();
	const profile = useQuery(api.profile.getUserProfile);
	const updateProfile = useMutation(api.profile.updateProfile);

	const currentLanguage = profile?.language ?? "en";

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ headerShown: false }} />

			{/* Header */}
			<View className="flex-row items-center px-4 py-3">
				<Pressable onPress={() => router.back()} className="mr-3 p-1">
					<Luicide name="arrow-left" size={24} color="#9ca3af" />
				</Pressable>
				<Text className="text-foreground text-xl font-bold">Language</Text>
			</View>

			<ScrollView className="px-6 pb-6">
				<Text className="text-muted-foreground mb-5 text-sm">
					Choose your preferred language.
				</Text>

				<View className="mt-1 gap-2">
					{LANGUAGES.map((lang) => {
						const isSelected = currentLanguage === lang.code;
						return (
							<Pressable
								key={lang.code}
								onPress={async () => {
									await updateProfile({ language: lang.code });
									router.back();
								}}
								className={`flex-row items-center rounded-xl border p-4 ${
									isSelected
										? "border-primary bg-primary/10"
										: "border-border bg-card"
								}`}
							>
								<View className="flex-1">
									<Text className="text-foreground text-base font-medium">
										{lang.label}
									</Text>
									<Text className="text-muted-foreground text-sm">
										{lang.native}
									</Text>
								</View>
								{isSelected && (
									<Luicide name="check-circle" size={22} color="#3b82f6" />
								)}
							</Pressable>
						);
					})}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
