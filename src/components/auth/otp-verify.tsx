import { Lucide } from "@react-native-vector-icons/lucide";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Animated,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";

import { authClient } from "~/lib/auth-client";
import DevOtpDisplay from "~/components/auth/dev-otp-display";

const OTP_LENGTH = 6;

function OtpInput({
	value,
	onChange,
	disabled,
}: {
	value: string;
	onChange: (v: string) => void;
	disabled: boolean;
}) {
	const inputRef = useRef<TextInput>(null);
	const digits = value
		.split("")
		.concat(new Array(OTP_LENGTH - value.length).fill(""));

	return (
		<Pressable onPress={() => inputRef.current?.focus()} className="relative">
			<TextInput
				ref={inputRef}
				value={value}
				onChangeText={(t) =>
					onChange(t.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH))
				}
				keyboardType="number-pad"
				maxLength={OTP_LENGTH}
				editable={!disabled}
				className="absolute h-full w-full opacity-0"
			/>
			<View className="flex-row justify-center gap-3">
				{digits.map((d, idx) => (
					<View
						key={idx}
						className={`h-14 w-12 items-center justify-center rounded-xl border-2 ${
							d
								? "border-primary bg-primary/10"
								: value.length === idx && !disabled
									? "border-primary bg-card"
									: "border-border bg-card"
						}`}
					>
						<Text
							className={`text-2xl font-bold ${
								d ? "text-foreground" : "text-muted-foreground"
							}`}
						>
							{d || ""}
						</Text>
					</View>
				))}
			</View>
		</Pressable>
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

export default function OtpVerify({
	phone,
	countryCode,
	onBack,
}: {
	phone: string;
	countryCode: string;
	onBack: () => void;
}) {
	const router = useRouter();

	const [otp, setOtp] = useState("");
	const [status, setStatus] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [resendCountdown, setResendCountdown] = useState(30);

	const fullPhone = countryCode + phone;

	useEffect(() => {
		if (resendCountdown <= 0) return;

		const timer = setInterval(() => {
			setResendCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
		}, 1000);

		return () => clearInterval(timer);
	}, [resendCountdown]);

	const handleVerifyOtp = async () => {
		if (!otp || otp.length < OTP_LENGTH) {
			setStatus("Please enter the complete code");
			return;
		}

		setIsLoading(true);
		setStatus("Verifying OTP...");

		const { data: _data, error } = await authClient.phoneNumber.verify({
			phoneNumber: fullPhone,
			code: otp,
		});

		setIsLoading(false);

		if (error) {
			setStatus(error.message ?? "Failed to verify OTP");
			return;
		}

		setStatus("Welcome to Fleetio!");
		setTimeout(() => {
			router.replace("/dashboard");
		}, 800);
	};

	const handleResendOtp = async () => {
		setOtp("");
		setStatus("");
		setIsLoading(true);

		const { error } = await authClient.phoneNumber.sendOtp({
			phoneNumber: fullPhone,
		});

		setIsLoading(false);

		if (error) {
			setStatus(error.message ?? "Failed to resend OTP");
			return;
		}

		setStatus("OTP resent successfully");
		setResendCountdown(30);
	};

	return (
		<View>
			<View className="mb-6 flex-row items-center gap-3">
				<Pressable
					onPress={onBack}
					className="h-10 w-10 items-center justify-center rounded-xl bg-muted active:opacity-70"
				>
					<Lucide name="arrow-left" size={20} color="#9ca3af" />
				</Pressable>
				<View className="flex-1">
					<Text className="text-foreground mb-0.5 text-2xl font-bold">
						Enter code
					</Text>
					<Text className="text-muted-foreground text-sm">
						Sent to {fullPhone}
					</Text>
				</View>
			</View>

			<StatusMessage status={status} />

			<View className="mb-6">
				<OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
			</View>

			<DevOtpDisplay phoneNumber={fullPhone} />

			<Pressable
				onPress={handleVerifyOtp}
				disabled={isLoading || otp.length < OTP_LENGTH}
				className={`bg-primary h-14 items-center justify-center rounded-xl ${
					isLoading || otp.length < OTP_LENGTH
						? "opacity-50"
						: "active:scale-[0.98]"
				}`}
			>
				{isLoading ? (
					<ActivityIndicator color="#000" />
				) : (
					<Text className="text-primary-foreground text-base font-semibold">
						Verify & Sign In
					</Text>
				)}
			</Pressable>

			<View className="mt-4 items-center">
				{resendCountdown > 0 ? (
					<Text className="text-muted-foreground text-sm">
						Resend code in{" "}
						<Text className="text-foreground font-semibold">
							{resendCountdown}s
						</Text>
					</Text>
				) : (
					<Pressable
						onPress={handleResendOtp}
						disabled={isLoading}
						className="active:opacity-70"
					>
						<Text className="text-primary text-sm font-semibold">
							Resend code
						</Text>
					</Pressable>
				)}
			</View>
		</View>
	);
}
