import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { Alert, Pressable, Text } from "react-native";

import { authClient } from "~/lib/auth-client";

interface SignOutButtonProps {
	/** Optional callback invoked after successful sign out. Defaults to navigating to "/". */
	onSignOut?: () => void;
	className?: string;
}

/**
 * A sign-out button that shows a confirmation alert before signing out.
 * Uses `authClient.signOut()` and optionally invokes `onSignOut` afterward.
 */
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
			className={`mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-red-600/30 bg-red-500/10 py-3 active:opacity-70 ${className || ""}`}
		>
			<Ionicons name="log-out-outline" size={18} color="#dc2626" />
			<Text className="text-base font-semibold text-red-600">Sign Out</Text>
		</Pressable>
	);
}
