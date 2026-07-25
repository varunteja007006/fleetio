import { api } from "@/convex/_generated/api";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "convex/react";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export default function DevOtpDisplay({
	phoneNumber,
}: {
	phoneNumber: string;
}) {
	const [showOtp, setShowOtp] = useState(false);
	const otpData = useQuery(api.otp.getOtpByPhone, { phoneNumber });

	if (!__DEV__) return null;

	const isLoading = otpData === undefined;

	return (
		<View className="mb-5 rounded-xl border-2 border-dashed border-yellow-500/50 bg-yellow-500/10 p-4">
			{!showOtp ? (
				<Pressable
					onPress={() => setShowOtp(true)}
					className="flex-row items-center justify-center gap-2 py-2 active:opacity-70"
				>
					<Lucide name="smartphone" size={16} color="#ca8a04" />
					<Text className="text-sm font-medium text-yellow-600">
						Show Dev OTP
					</Text>
				</Pressable>
			) : isLoading ? (
				<View className="items-center py-2">
					<ActivityIndicator size="small" color="#ca8a04" />
					<Text className="mt-1 text-xs text-yellow-600">Fetching OTP...</Text>
				</View>
			) : otpData ? (
				<>
					<View className="mb-1.5 flex-row items-center justify-center gap-2">
						<Text className="text-xs font-medium text-yellow-600">Dev OTP</Text>
					</View>
					<Text
						className="text-center text-3xl font-bold tracking-[0.3em] text-yellow-600"
						selectable
					>
						{otpData.code}
					</Text>
				</>
			) : (
				<View className="flex-row items-center justify-center gap-2 py-2">
					<Lucide name="alert-circle" size={16} color="#ca8a04" />
					<Text className="text-xs text-yellow-600">
						No OTP found for {phoneNumber}
					</Text>
				</View>
			)}
		</View>
	);
}
