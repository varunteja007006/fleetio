import Luicide from "@react-native-vector-icons/lucide";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const faqs = [
	{
		q: "How do I start a route?",
		a: "Navigate to the Routes tab, select a route, and tap 'Start Route'. Make sure you have an active assignment.",
	},
	{
		q: "How do I report an incident?",
		a: "During an active route run, tap the 'Report Incident' button. You can select the type, add a description, and attach photos.",
	},
	{
		q: "How do I update my profile?",
		a: "Go to the Profile tab and tap 'Edit Profile' to update your personal information, identification, and emergency contact details.",
	},
	{
		q: "Who can see my location?",
		a: "Your location is shared with managers and admins only during active route runs for tracking purposes.",
	},
];

function FAQItem({
	question,
	answer,
}: {
	question: string;
	answer: string;
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<View className="mb-2 overflow-hidden rounded-xl border border-gray-500/30">
			<Pressable
				onPress={() => setIsOpen(!isOpen)}
				className="flex-row items-center justify-between px-4 py-3.5 active:opacity-70"
			>
				<Text className="text-foreground flex-1 pr-2 text-base font-medium">
					{question}
				</Text>
				<Luicide
					name={isOpen ? "chevron-up" : "chevron-down"}
					size={18}
					color="#9ca3af"
				/>
			</Pressable>
			{isOpen && (
				<View className="border-t border-gray-500/20 px-4 py-3">
					<Text className="text-muted-foreground text-sm leading-6">{answer}</Text>
				</View>
			)}
		</View>
	);
}

export default function HelpCenterScreen() {
	const router = useRouter();

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ headerShown: false }} />

			<ScrollView className="px-6 pb-8">
				<View className="flex-row items-center py-3">
					<Pressable onPress={() => router.back()} className="mr-3 p-1">
						<Luicide name="arrow-left" size={24} color="#9ca3af" />
					</Pressable>
					<Text className="text-foreground text-xl font-bold">Help Center</Text>
				</View>
				{/* FAQ Section */}
				<View className="mt-2">
					<Text className="text-foreground mb-4 text-lg font-semibold">
						Frequently Asked Questions
					</Text>
					{faqs.map((faq, i) => (
						<FAQItem key={i} question={faq.q} answer={faq.a} />
					))}
				</View>

				{/* Contact Options */}
				<View className="mt-8">
					<Text className="text-foreground mb-4 text-lg font-semibold">
						Still need help?
					</Text>

					<Pressable
						onPress={() =>
							Linking.openURL("mailto:support@fleetio.app?subject=Help%20Request")
						}
						className="mb-3 flex-row items-center rounded-xl border border-gray-500/30 p-4 active:opacity-70"
					>
						<View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-blue-500/30">
							<Luicide name="mail" size={20} color="#3b82f6" />
						</View>
						<View className="flex-1">
							<Text className="text-foreground text-base font-medium">
								Contact Support
							</Text>
							<Text className="text-muted-foreground mt-0.5 text-sm">
								support@fleetio.app
							</Text>
						</View>
						<Luicide name="external-link" size={18} color="#9ca3af" />
					</Pressable>

					<Pressable
						onPress={() => router.push("/dashboard/submit-request")}
						className="mb-3 flex-row items-center rounded-xl border border-gray-500/30 p-4 active:opacity-70"
					>
						<View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-green-500/30">
							<Luicide name="form-input" size={20} color="#10b981" />
						</View>
						<View className="flex-1">
							<Text className="text-foreground text-base font-medium">
								Submit a Request
							</Text>
							<Text className="text-muted-foreground mt-0.5 text-sm">
								Send us a message from the app
							</Text>
						</View>
						<Luicide name="arrow-right" size={18} color="#9ca3af" />
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
