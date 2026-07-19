import { Lucide } from "@react-native-vector-icons/lucide";
import { useRouter } from "expo-router";
import { Alert, Pressable, Text } from "react-native";

import { authClient } from "~/lib/auth-client";

interface SignOutButtonProps {
	onSignOut?: () => void;
	className?: string;
}

export default function SignOutButton({
	onSignOut,
	className,
}: SignOutButtonProps) {
	const router = useRouter();

	const handleSignOut = () => {
		Alert.alert("Sign Out", "Are you sure you want to sign out?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Sign Out",
				style: "destructive",
				onPress: async () => {
					await authClient.signOut();
					if (onSignOut) {
						onSignOut();
					} else {
						router.push("/");
					}
				},
			},
		]);
	};

	return (
		<Pressable
			onPress={handleSignOut}
			className={`flex-row items-center justify-center gap-2 rounded-xl border border-red-600/20 bg-red-500/8 py-3.5 active:opacity-70 ${className || ""}`}
		>
			<Lucide name="log-out" size={18} color="#dc2626" />
			<Text className="text-base font-semibold text-red-500">Sign Out</Text>
		</Pressable>
	);
}
