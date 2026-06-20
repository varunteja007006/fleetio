import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { Button, Pressable, Text, View } from "react-native";
import { authClient } from "../lib/auth-client";

export default function Index() {
	const { data: session } = authClient.useSession();

	const isAdmin = useQuery(api.profile.getIsAdminProfile);

	const router = useRouter();

	const renderContent = () => {
		if (session?.session) {
			return (
				<View className="flex flex-col gap-4">
					<Pressable onPress={() => router.push("/dashboard")}>
						<Text className="text-lg font-semibold text-center p-4 border rounded-lg">
							Go to Dashboard
						</Text>
					</Pressable>
					{isAdmin && (
						<>
							<Button
								title="Go to Admin Route"
								onPress={() => router.push("/admin/route")}
							/>
							<Button
								title="Go to Admin Users"
								onPress={() => router.push("/admin/users")}
							/>
						</>
					)}
				</View>
			);
		}

		return <Button title="Go to Auth" onPress={() => router.push("/auth")} />;
	};

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<View className={"flex-1 justify-center items-center gap-10"}>
				<Text className="text-3xl font-bold ">Welcome to Fleetio!</Text>
				{renderContent()}
			</View>
		</>
	);
}
