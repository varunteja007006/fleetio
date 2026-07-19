import { api } from "@/convex/_generated/api";
import { Lucide } from "@react-native-vector-icons/lucide";
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

	const router = useRouter();

	if (session?.session) {
		return (
			<>
				<Stack.Screen options={{ headerShown: false }} />
				<View className="flex-1 bg-background">
					<View className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10" />
					<View className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-accent/10" />

					<View className="flex-1 px-6 pt-20">
						<View className="mb-8 items-center">
							<View className="mb-3 h-16 w-16 items-center justify-center rounded-2xl bg-primary">
								<Lucide name="truck" size={32} color="#000" />
							</View>
							<Text className="text-foreground text-3xl font-bold tracking-tight">
								Fleetio
							</Text>
							<Text className="text-muted-foreground mt-1 text-base">
								Welcome back!
							</Text>
						</View>

						<ProfileCard profile={userProfile} session={session} />

						<View className="mt-6 gap-3">
							<Pressable
								onPress={() => router.push("/dashboard")}
								className="bg-primary items-center rounded-xl px-5 py-4 active:opacity-70"
							>
								<Text className="text-primary-foreground text-lg font-semibold">
									Go to Dashboard
								</Text>
							</Pressable>

							<SignOutButton onSignOut={() => router.push("/")} />
						</View>
					</View>
				</View>
			</>
		);
	}

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<View className="flex-1 bg-background">
				<View className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/8" />
				<View className="absolute top-60 -left-20 h-56 w-56 rounded-full bg-accent/8" />
				<View className="absolute -bottom-16 -right-8 h-48 w-48 rounded-full bg-primary/5" />

				<View className="flex-1 px-6 pt-24">
					<View className="mb-10 items-center">
						<View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
							<Lucide name="truck" size={40} color="#000" />
						</View>
						<Text className="text-foreground text-4xl font-bold tracking-tight">
							Fleetio
						</Text>
						<Text className="text-muted-foreground mt-1.5 text-center text-base">
							Fleet management, simplified
						</Text>
					</View>

					<View className="flex-1">
						<OtpSignUp />
					</View>
				</View>
			</View>
		</>
	);
}
