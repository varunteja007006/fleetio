import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import OtpSignUp from "~/components/auth/otp-sign-up";
import ProfileCard from "~/components/profile-card";
import SignOutButton from "~/components/sign-out-button";
import { authClient } from "~/lib/auth-client";

export default function Index() {
	const { data: session } = authClient.useSession();

	const userProfile = useQuery(api.profile.getUserProfile);

	const isAdmin = useQuery(api.profile.getIsAdminProfile);

	const router = useRouter();

	const renderContent = () => {
		if (session?.session) {
			return (
				<>
					{/* User info card + sign-out button */}
					<ProfileCard profile={userProfile} session={session} />

					<SignOutButton
						onSignOut={() => router.push("/")}
						className="w-full"
					/>

					{/* Navigation buttons */}
					<Pressable
						onPress={() => router.push("/dashboard")}
						className="bg-primary rounded-xl px-5 py-4 active:opacity-70 w-full"
					>
						<Text className="text-primary-foreground text-center text-lg font-semibold">
							Go to Dashboard
						</Text>
					</Pressable>

					{isAdmin && (
						<Pressable
							onPress={() => router.push("/admin")}
							className="rounded-xl border border-gray-500/30 px-5 py-4 active:opacity-70 w-full"
						>
							<Text className="text-secondary-foreground text-center font-semibold">
								Go to Admin Dashboard
							</Text>
						</Pressable>
					)}
				</>
			);
		}

		return <OtpSignUp />;
	};

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<View className="flex-1 w-full items-center justify-center gap-8 px-6">
				<Text className="text-foreground text-3xl font-bold">
					Welcome to Fleetio!
				</Text>
				{renderContent()}
			</View>
		</>
	);
}
