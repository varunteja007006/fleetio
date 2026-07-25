import { Lucide } from "@react-native-vector-icons/lucide";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Animated,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import z from "zod";

import { useAppForm } from "~/components/forms/hooks";
import { authClient } from "~/lib/auth-client";
import OtpVerify from "~/components/auth/otp-verify";

const COUNTRY_CODE = "+91";

const schema = z.object({
	phone: z
		.string()
		.min(10, "Phone number must be at least 10 digits")
		.max(15, "Phone number must be at most 15 digits"),
});

function StepIndicator({ step }: { step: number }) {
	return (
		<View className="mb-8 flex-row items-center justify-center gap-2">
			{["Phone", "Verify"].map((label, idx) => {
				const isActive = step === idx;
				const isDone = step > idx;
				return (
					<View key={label} className="flex-row items-center gap-2">
						<View
							className={`h-8 w-8 items-center justify-center rounded-full ${
								isDone
									? "bg-primary"
									: isActive
										? "bg-primary border-border border-2"
										: "bg-muted"
							}`}
						>
							{isDone ? (
								<Lucide name="check" size={16} color="#000" />
							) : (
								<Text
									className={`text-sm font-bold ${
										isActive ? "text-primary-foreground" : "text-muted-foreground"
									}`}
								>
									{idx + 1}
								</Text>
							)}
						</View>
						<Text
							className={`text-sm font-medium ${
								isActive || isDone ? "text-foreground" : "text-muted-foreground"
							}`}
						>
							{label}
						</Text>
						{idx === 0 && <View className="mx-1 h-px w-8 bg-border" />}
					</View>
				);
			})}
		</View>
	);
}

function StatusMessage({ status }: { status: string }) {
	const opacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (status) {
			Animated.timing(opacity, {
				toValue: 1,
				duration: 250,
				useNativeDriver: true,
			}).start();
		} else {
			opacity.setValue(0);
		}
	}, [status, opacity]);

	if (!status) return null;

	const isSuccess = status.toLowerCase().includes("success");
	const isError =
		status.toLowerCase().includes("fail") ||
		status.toLowerCase().includes("invalid") ||
		status.toLowerCase().includes("error") ||
		status.toLowerCase().includes("valid");

	return (
		<Animated.View
			style={{ opacity }}
			className={`mb-5 flex-row items-center gap-2 rounded-xl px-4 py-3 ${
				isSuccess
					? "bg-green-500/15"
					: isError
						? "bg-red-500/15"
						: "bg-blue-500/15"
			}`}
		>
			<Lucide
				name={isSuccess ? "check-circle" : isError ? "alert-circle" : "info"}
				size={18}
				color={isSuccess ? "#16a34a" : isError ? "#dc2626" : "#2563eb"}
			/>
			<Text
				className={`flex-1 text-sm font-medium ${
					isSuccess
						? "text-green-600"
						: isError
							? "text-red-500"
							: "text-blue-600"
				}`}
			>
				{status}
			</Text>
		</Animated.View>
	);
}

export default function OtpSignUp() {
	const [countryCode] = useState(COUNTRY_CODE);
	const [phone, setPhone] = useState("");
	const [otpSent, setOtpSent] = useState(false);
	const [status, setStatus] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const slideAnim = useRef(new Animated.Value(0)).current;
	const contentOpacity = useRef(new Animated.Value(1)).current;

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

			Animated.sequence([
				Animated.timing(contentOpacity, {
					toValue: 0,
					duration: 150,
					useNativeDriver: true,
				}),
				Animated.timing(slideAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(contentOpacity, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true,
				}),
			]).start();

			setOtpSent(true);
		},
	});

	const slideTranslate = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [20, 0],
	});

	const handleBackToPhone = useCallback(() => {
		Animated.sequence([
			Animated.timing(contentOpacity, {
				toValue: 0,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.timing(slideAnim, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.timing(contentOpacity, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}),
		]).start();
		setOtpSent(false);
	}, [contentOpacity, slideAnim]);

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="flex-1"
		>
			<ScrollView
				contentContainerStyle={{ flexGrow: 1 }}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<View className="flex-1">
					<StepIndicator step={otpSent ? 1 : 0} />

					<Animated.View
						style={{
							opacity: contentOpacity,
							transform: [{ translateY: slideTranslate }],
						}}
					>
						{!otpSent ? (
							<View>
								<View className="mb-6">
									<Text className="text-foreground mb-1 text-2xl font-bold">
										Sign in
									</Text>
									<Text className="text-muted-foreground text-base">
										Enter your phone number to continue
									</Text>
								</View>

								<StatusMessage status={status} />

								<View className="mb-6">
									<View className="mb-2 flex-row items-center gap-1.5">
										<View className="rounded-lg border border-border bg-card px-3 py-3">
											<Text className="text-foreground text-base font-medium">
												{countryCode}
											</Text>
										</View>
										<View className="flex-1">
											<form.AppField name="phone">
												{(field) => (
													<field.Input
														label=""
														keyboardType="phone-pad"
														autoCapitalize="none"
														editable={!isLoading}
														placeholder="9876543210"
														placeholderTextColor="#71717A"
													/>
												)}
											</form.AppField>
										</View>
									</View>
								</View>

								<Pressable
									onPress={async () => form.handleSubmit()}
									disabled={isLoading}
									className={`bg-primary h-14 items-center justify-center rounded-xl ${
										isLoading ? "opacity-60" : "active:scale-[0.98]"
									}`}
								>
									{isLoading ? (
										<ActivityIndicator color="#000" />
									) : (
										<Text className="text-primary-foreground text-base font-semibold">
											Send Code
										</Text>
									)}
								</Pressable>
							</View>
						) : (
							<OtpVerify
								phone={phone}
								countryCode={countryCode}
								onBack={handleBackToPhone}
							/>
						)}
					</Animated.View>

					<View className="mt-auto mb-4 pt-8">
						<Text className="text-muted-foreground text-center text-xs">
							By continuing, you agree to our{" "}
							<Text className="text-foreground font-medium">Terms of Service</Text>{" "}
							and{" "}
							<Text className="text-foreground font-medium">
								Privacy Policy
							</Text>
						</Text>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
