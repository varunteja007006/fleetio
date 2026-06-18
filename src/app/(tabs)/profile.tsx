import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authClient } from "~/lib/auth-client";

// Settings Item Component
function SettingsItem({
	icon,
	label,
	value,
	onPress,
	showArrow = true,
	color = "#9ca3af",
}: {
	icon: string;
	label: string;
	value?: string;
	onPress: () => void;
	showArrow?: boolean;
	color?: string;
}) {
	return (
		<Pressable
			onPress={onPress}
			className="bg-card border-border mb-2 flex-row items-center justify-between rounded-xl border p-4 active:opacity-70"
		>
			<View className="flex-1 flex-row items-center">
				<View
					className="mr-3 h-10 w-10 items-center justify-center rounded-lg"
					style={{ backgroundColor: color + "20" }}
				>
					<Ionicons name={icon as any} size={20} color={color} />
				</View>
				<View className="flex-1">
					<Text className="text-foreground text-base font-medium">{label}</Text>
					{value && (
						<Text className="text-muted-foreground text-sm">{value}</Text>
					)}
				</View>
			</View>
			{showArrow && (
				<Ionicons name="chevron-forward" size={20} color="#9ca3af" />
			)}
		</Pressable>
	);
}

export default function ProfileScreen() {
	const router = useRouter();
	const { data: session } = authClient.useSession();

	const handleSignOut = async () => {
		Alert.alert("Sign Out", "Are you sure you want to sign out?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Sign Out",
				style: "destructive",
				onPress: async () => {
					await authClient.signOut();
					router.replace("/auth");
				},
			},
		]);
	};

	return (
		<SafeAreaView className="bg-background">
			<ScrollView className="">
				{/* Profile Header */}
				<View className="mb-6 items-center px-6 py-8">
					<View className="bg-primary mb-4 h-24 w-24 items-center justify-center rounded-full">
						<Text className="text-primary-foreground text-4xl font-bold">
							{session?.user?.name?.[0]?.toUpperCase() ?? "U"}
						</Text>
					</View>
					<Text className="text-foreground text-2xl font-bold">
						{session?.user?.name ?? "User"}
					</Text>
					<Text className="text-muted-foreground mt-1 text-sm">
						{session?.user?.email ??
							session?.user?.phoneNumber ??
							"Not available"}
					</Text>
				</View>

				{/* Account Section */}
				<View className="mb-6 px-6">
					<Text className="text-foreground mb-3 text-sm font-semibold uppercase">
						Account
					</Text>
					<SettingsItem
						icon="person-outline"
						label="Edit Profile"
						onPress={() => {}}
						color="#3b82f6"
					/>
					<SettingsItem
						icon="shield-checkmark-outline"
						label="Privacy & Security"
						onPress={() => {}}
						color="#10b981"
					/>
					<SettingsItem
						icon="notifications-outline"
						label="Notifications"
						value="Enabled"
						onPress={() => {}}
						color="#f59e0b"
					/>
				</View>

				{/* Preferences Section */}
				<View className="mb-6 px-6">
					<Text className="text-foreground mb-3 text-sm font-semibold uppercase">
						Preferences
					</Text>
					<SettingsItem
						icon="contrast-outline"
						label="Appearance"
						value="System"
						onPress={() => {}}
						color="#8b5cf6"
					/>
					<SettingsItem
						icon="language-outline"
						label="Language"
						value="English"
						onPress={() => {}}
						color="#06b6d4"
					/>
					<SettingsItem
						icon="location-outline"
						label="Location"
						value="San Francisco, CA"
						onPress={() => {}}
						color="#ec4899"
					/>
				</View>

				{/* Support Section */}
				<View className="mb-6 px-6">
					<Text className="text-foreground mb-3 text-sm font-semibold uppercase">
						Support
					</Text>
					<SettingsItem
						icon="help-circle-outline"
						label="Help Center"
						onPress={() => {}}
						color="#3b82f6"
					/>
					<SettingsItem
						icon="document-text-outline"
						label="Terms & Conditions"
						onPress={() => {}}
						color="#10b981"
					/>
					<SettingsItem
						icon="information-circle-outline"
						label="About"
						value="Version 1.0.0"
						onPress={() => {}}
						color="#9ca3af"
					/>
				</View>

				{/* Sign Out Button */}
				<View className="px-6 pb-8">
					<Pressable
						onPress={handleSignOut}
						className="bg-destructive rounded-xl py-4 active:opacity-70"
					>
						<View className="flex-row items-center justify-center">
							<Ionicons name="log-out-outline" size={20} color="#fff" />
							<Text className="text-destructive-foreground ml-2 text-base font-semibold">
								Sign Out
							</Text>
						</View>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
