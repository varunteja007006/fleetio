import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Luicide from "@react-native-vector-icons/lucide";

export default function TermsConditionsScreen() {
	const router = useRouter();

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ headerShown: false }} />

			{/* Header */}
			<View className="flex-row items-center px-4 py-3">
				<Pressable onPress={() => router.back()} className="mr-3 p-1">
					<Luicide name="arrow-left" size={24} color="#9ca3af" />
				</Pressable>
				<Text className="text-foreground text-xl font-bold">
					Terms & Conditions
				</Text>
			</View>

			<ScrollView className="px-6 pb-8">
				<Text className="text-foreground mt-4 text-base leading-7">
					This is a placeholder for the Terms & Conditions page. The content
					will be added soon.
				</Text>
				<Text className="text-muted-foreground mt-4 text-sm leading-6">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
					auctor, nunc nec ultricies ultricies, nunc nunc ultricies nunc, nec
					ultricies nunc nunc nec ultricies. Nullam auctor, nunc nec ultricies
					ultricies, nunc nunc ultricies nunc, nec ultricies nunc nunc nec
					ultricies.
				</Text>
				<Text className="text-muted-foreground mt-4 text-sm leading-6">
					Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
					enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
					ut aliquip ex ea commodo consequat.
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
}
