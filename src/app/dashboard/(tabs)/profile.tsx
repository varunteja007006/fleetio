import { api } from "@/convex/_generated/api";
import Luicide from "@react-native-vector-icons/lucide";
import { useMutation, useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { JSX } from "react/jsx-runtime";

import ProfileCard from "~/components/profile-card";
import SignOutButton from "~/components/sign-out-button";
import { authClient } from "~/lib/auth-client";

const LANGUAGE_LABELS: Record<string, string> = {
	en: "English",
	hi: "Hindi",
	gu: "Gujarati",
};

// Settings Item Component
function SettingsItem({
	icon,
	label,
	description,
	onPress,
	showArrow,
	color = "#9ca3af",
}: {
	icon: JSX.Element;
	label: string;
	description?: string;
	onPress: () => void;
	showArrow?: boolean;
	color?: string;
}) {
	return (
		<Pressable
			onPress={onPress}
			className="mb-2 flex-row items-center justify-between rounded-xl border border-gray-500/30 p-1 pr-3 active:opacity-70"
			style={{ backgroundColor: color + "10" }}
		>
			<View className="flex-1 flex-row items-center">
				<View
					className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
					style={{ backgroundColor: color + "30" }}
				>
					{icon}
				</View>
				<View className="flex-1 gap-0.5">
					<Text className="text-base font-medium">{label}</Text>
					{description && <Text className="text-sm">{description}</Text>}
				</View>
			</View>
			{showArrow && <Luicide name="arrow-right" size={20} color="#9ca3af" />}
		</Pressable>
	);
}

export default function ProfileScreen() {
	const router = useRouter();

	const { data: session } = authClient.useSession();

	const userProfile = useQuery(api.profile.getUserProfile);

	const updateProfile = useMutation(api.profile.updateProfile);

	if (!session?.user) {
		return null;
	}

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<SafeAreaView>
				<ScrollView className="px-6 py-6">
					{/* Profile Header */}
					<View className="mb-6">
						<ProfileCard profile={userProfile} session={session} />
					</View>

					{/* Account Section */}
					<View className="mb-6">
						<Text className="mb-3 text-sm font-semibold uppercase">
							Account
						</Text>
						<SettingsItem
							icon={<Luicide name={"pencil"} size={20} color={"#3b82f6"} />}
							label="Edit Profile"
							onPress={() => router.push("/dashboard/edit-profile")}
							color="#3b82f6"
							showArrow
						/>

						<SettingsItem
							icon={<Luicide name={"bell"} size={20} color={"#f59e0b"} />}
							label="Notifications"
							description={
								(userProfile?.notificationsEnabled ?? true)
									? "Enabled"
									: "Disabled"
							}
							onPress={() =>
								updateProfile({
									notificationsEnabled: !(
										userProfile?.notificationsEnabled ?? true
									),
								})
							}
							color="#f59e0b"
						/>
					</View>

					{/* Preferences Section */}
					<View className="mb-6">
						<Text className="mb-3 text-sm font-semibold uppercase">
							Preferences
						</Text>
						<SettingsItem
							icon={<Luicide name={"droplet"} size={20} color={"#8b5cf6"} />}
							label="Appearance"
							description="Light"
							onPress={() => {}}
							color="#8b5cf6"
						/>
						<SettingsItem
							icon={<Luicide name={"languages"} size={20} color={"#06b6d4"} />}
							label="Language"
							description={
								LANGUAGE_LABELS[userProfile?.language ?? ""] ?? "English"
							}
							onPress={() => router.push("/dashboard/language")}
							color="#06b6d4"
							showArrow
						/>
					</View>

					{/* Support Section */}
					<View className="mb-6">
						<Text className="mb-3 text-sm font-semibold uppercase">
							Support
						</Text>
						<SettingsItem
							icon={
								<Luicide name={"help-circle"} size={20} color={"#3b82f6"} />
							}
							label="Help Center"
							onPress={() => router.push("/dashboard/help-center")}
							color="#3b82f6"
							showArrow
						/>
						<SettingsItem
							icon={<Luicide name={"shield"} size={20} color={"#f59e0b"} />}
							label="Privacy & Security"
							onPress={() => router.push("/dashboard/privacy-policy")}
							color="#f59e0b"
							showArrow
						/>
						<SettingsItem
							icon={
								<Luicide name={"alert-circle"} size={20} color={"#10b981"} />
							}
							label="Terms & Conditions"
							onPress={() => router.push("/dashboard/terms-conditions")}
							color="#10b981"
							showArrow
						/>
						<SettingsItem
							icon={<Luicide name={"cog"} size={20} color={"#9ca3af"} />}
							label="About"
							description="Version 1.0.0"
							onPress={() => {}}
							color="#9ca3af"
						/>
					</View>

					{/* Sign Out Button */}
					<View className="mb-20">
						<SignOutButton onSignOut={() => router.push("/")} />
					</View>
				</ScrollView>
			</SafeAreaView>
		</>
	);
}
