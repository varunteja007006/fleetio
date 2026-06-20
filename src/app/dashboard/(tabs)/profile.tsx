import { api } from "@/convex/_generated/api";
import Luicide from "@react-native-vector-icons/lucide";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { JSX } from "react/jsx-runtime";

import { authClient } from "~/lib/auth-client";

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
			className="mb-2 flex-row items-center justify-between rounded-xl border p-1 pr-3 active:opacity-70"
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

	const handleSignOut = async () => {
		Alert.alert("Sign Out", "Are you sure you want to sign out?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Sign Out",
				style: "destructive",
				onPress: async () => {
					await authClient.signOut();
					router.push("/auth");
				},
			},
		]);
	};

	if (!session?.user) {
		return null;
	}

	const firstName = userProfile?.firstName ?? "";
	const lastName = userProfile?.lastName ?? "";

	const fullName = firstName + lastName;
	const role =
		userProfile?.role === "new_user" ? "NEW" : (userProfile?.role ?? "");

	const profileStatus = userProfile?.status;

	return (
		<>
			<ScrollView className="px-6 py-6">
				{/* Profile Header */}
				<View className="mb-6 items-center">
					<View className="mb-4 h-24 w-24 border items-center justify-center rounded-full">
						<Text className="text-4xl font-bold">
							{fullName?.[0]?.toUpperCase() ?? ""}
						</Text>
					</View>
					<Text className="text-2xl font-bold">{fullName}</Text>
					<Text className="mt-1 text-sm">{userProfile?.email}</Text>
					<Text className="mt-1 text-sm">{userProfile?.phoneNumber}</Text>
					<Text className="mt-1 text-sm">{role}</Text>
					{profileStatus && (
						<Text
							className={`mt-1 text-sm uppercase px-4 py-2 rounded-2xl ${profileStatus === "approved" ? "text-green-600 bg-green-100" : profileStatus === "pending" ? "text-white bg-amber-500" : "bg-red-100 text-red-600"}`}
						>
							{profileStatus}
						</Text>
					)}
				</View>

				{/* Account Section */}
				<View className="mb-6">
					<Text className="mb-3 text-sm font-semibold uppercase">Account</Text>
					<SettingsItem
						icon={<Luicide name={"pencil"} size={20} color={"#3b82f6"} />}
						label="Edit Profile"
						onPress={() => {}}
						color="#3b82f6"
						showArrow
					/>

					<SettingsItem
						icon={<Luicide name={"bell"} size={20} color={"#f59e0b"} />}
						label="Notifications"
						description="Enabled"
						onPress={() => {}}
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
						description="English"
						onPress={() => {}}
						color="#06b6d4"
					/>
				</View>

				{/* Support Section */}
				<View className="mb-6">
					<Text className="mb-3 text-sm font-semibold uppercase">Support</Text>
					<SettingsItem
						icon={<Luicide name={"help-circle"} size={20} color={"#3b82f6"} />}
						label="Help Center"
						onPress={() => {}}
						color="#3b82f6"
						showArrow
					/>
					<SettingsItem
						icon={<Luicide name={"shield"} size={20} color={"#f59e0b"} />}
						label="Privacy & Security"
						onPress={() => {}}
						color="#f59e0b"
						showArrow
					/>
					<SettingsItem
						icon={<Luicide name={"alert-circle"} size={20} color={"#10b981"} />}
						label="Terms & Conditions"
						onPress={() => {}}
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
					<Pressable
						onPress={handleSignOut}
						className="bg-red-200 border-red-600 border rounded-xl py-4 active:opacity-70"
					>
						<View className="flex-row items-center justify-center">
							<Luicide name="log-out" size={20} />
							<Text className="text-destructive-foreground ml-2 text-base font-semibold">
								Sign Out
							</Text>
						</View>
					</Pressable>
				</View>
			</ScrollView>
		</>
	);
}
