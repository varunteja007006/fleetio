import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import OtpSignUp from "~/components/auth/otp-sign-up";
import { authClient } from "~/lib/auth-client";

export default function Index() {
	const { data: session } = authClient.useSession();

	const isAdmin = useQuery(api.profile.getIsAdminProfile);

	const router = useRouter();

	const renderContent = () => {
		if (session?.session) {
			return (
				<View className="flex flex-col gap-4">
					<Pressable
						onPress={() => router.push("/dashboard")}
						className="bg-primary rounded-lg px-5 py-3"
					>
						<Text className="text-primary-foreground text-center text-lg font-semibold">
							Go to Dashboard
						</Text>
					</Pressable>
					{isAdmin && (
						<Pressable
							onPress={() => router.push("/admin")}
							className="px-5 py-3"
						>
							<Text className="text-secondary-foreground text-center font-semibold">
								Go to Admin Dashboard
							</Text>
						</Pressable>
					)}
				</View>
			);
		}

		return <OtpSignUp />;
	};

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<View className=" flex-1 items-center justify-center gap-10 px-6">
				<Text className="text-foreground text-3xl font-bold">
					Welcome to Fleetio!
				</Text>
				{renderContent()}
			</View>
		</>
	);
}
