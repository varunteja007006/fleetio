import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	useColorScheme,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import z from "zod";

import { useAppForm } from "~/components/forms/hooks";
import { authClient } from "~/lib/auth-client";

const COUNTRY_CODE = "+91";

const schema = z.object({
	phone: z
		.string()
		.min(10, "Phone number must be at least 10 digits")
		.max(15, "Phone number must be at most 15 digits"),
});

export default function AuthScreen() {
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";

	const router = useRouter();

	const form = useAppForm({
		defaultValues: {
			phone: "",
		},
		validators: { onSubmit: schema },
		onSubmit: async ({ value }) => {
			setPhone(value.phone);

			setIsLoading(true);
			setStatus("Sending OTP...");

			const { data: _data, error } = await authClient.phoneNumber.sendOtp({
				phoneNumber: countryCode + value.phone,
			});

			setIsLoading(false);

			if (error) {
				setStatus(error.message ?? "Failed to send OTP");
				return;
			}

			setOtpSent(true);
			setStatus("OTP sent successfully! Check your phone.");
		},
	});

	const [countryCode] = useState(COUNTRY_CODE);
	const [phone, setPhone] = useState("");
	const [otp, setOtp] = useState("");
	const [otpSent, setOtpSent] = useState(false);
	const [status, setStatus] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleVerifyOtp = async () => {
		if (!otp || otp.length < 4) {
			setStatus("Please enter a valid OTP");
			return;
		}

		setIsLoading(true);
		setStatus("Verifying OTP...");

		const { data: _data, error } = await authClient.phoneNumber.verify({
			phoneNumber: countryCode + phone,
			code: otp,
		});

		setIsLoading(false);

		if (error) {
			setStatus(error.message ?? "Failed to verify OTP");
			return;
		}

		setStatus("Phone verified successfully!");
		setTimeout(() => {
			router.replace("/profile");
		}, 500);
	};

	const handleResendOtp = () => {
		setOtp("");
		setOtpSent(false);
		setStatus("");
	};

	return (
		<SafeAreaView>
			<Stack.Screen options={{ headerShown: false }} />
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView
					contentContainerStyle={{
						flexGrow: 1,
						justifyContent: "center",
						padding: 24,
					}}
					keyboardShouldPersistTaps="handled"
					className="h-full"
				>
					{/* Header */}
					<View className="mb-8">
						<Text className="text-foreground mb-2 text-3xl font-bold">
							Welcome to Fleetio
						</Text>
						<Text className="text-muted-foreground text-base">
							Sign in with your phone number
						</Text>
					</View>

					{/* Phone number and OTP input */}
					{otpSent ? (
						<View className="mb-4">
							<Text className="text-foreground mb-2 text-sm font-medium">
								Verification Code
							</Text>
							<TextInput
								className="bg-card text-foreground border-border rounded-lg border px-8 py-3 text-base"
								placeholder="Enter 6-digit code"
								placeholderTextColor="#71717A"
								value={otp}
								onChangeText={setOtp}
								keyboardType="number-pad"
								maxLength={6}
								editable={!isLoading}
							/>
						</View>
					) : (
						<View className="mb-4">
							<form.AppField name="phone">
								{(field) => (
									<field.Input
										label="Phone Number"
										keyboardType="phone-pad"
										autoCapitalize="none"
										editable={!isLoading}
										placeholder="Eg: 9876543210"
										placeholderTextColor="#71717A"
									/>
								)}
							</form.AppField>
						</View>
					)}

					{/* Status Message */}
					{status && (
						<View
							className={`mb-4 rounded-lg p-3 ${
								status.includes("success")
									? "bg-green-500/20"
									: status.includes("Failed") || status.includes("valid")
										? "bg-red-500/20"
										: "bg-blue-500/20"
							}`}
						>
							<Text
								className={`text-sm ${
									status.includes("success")
										? ""
										: status.includes("Failed") || status.includes("valid")
											? "text-red-400"
											: "text-blue-400"
								}`}
							>
								{status}
							</Text>
						</View>
					)}

					{/* Action Button */}
					{otpSent ? (
						<>
							<Pressable
								onPress={handleVerifyOtp}
								disabled={isLoading}
								className={`bg-primary mb-3 rounded-lg py-4 ${isLoading ? "opacity-50" : "active:opacity-80"}`}
							>
								{isLoading ? (
									<ActivityIndicator color="#FFFFFF" />
								) : (
									<Text className="text-primary-foreground text-center text-base font-semibold">
										Verify OTP
									</Text>
								)}
							</Pressable>

							<Pressable
								onPress={handleResendOtp}
								disabled={isLoading}
								className="active:opacity-70"
							>
								<Text className="text-primary text-center text-sm font-medium">
									Resend OTP
								</Text>
							</Pressable>
						</>
					) : (
						<Pressable
							onPress={async () => form.handleSubmit()}
							disabled={isLoading}
							className={`bg-primary rounded-lg py-4 ${isLoading ? "opacity-50" : "active:opacity-80"}`}
						>
							{isLoading ? (
								<ActivityIndicator color="#FFFFFF" />
							) : (
								<Text className="text-primary-foreground text-center text-base font-semibold">
									Send OTP
								</Text>
							)}
						</Pressable>
					)}

					{/* Footer */}
					<View className="mt-8">
						<Text className="text-muted-foreground text-center text-xs will-change-variable">
							By continuing, you agree to our Terms of Service and Privacy
							Policy
						</Text>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
