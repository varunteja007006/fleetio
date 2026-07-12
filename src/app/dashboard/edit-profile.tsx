import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import z from "zod";
import { useAppForm } from "~/components/forms/hooks";

const editProfileSchema = z.object({
	firstName: z.string(),
	lastName: z.string(),
	aadharNumber: z.string(),
	panNumber: z.string(),
	emergencyPhone: z.string(),
	insurance: z.string(),
	hasInsurance: z.boolean(),
});

export default function EditProfileScreen() {
	const router = useRouter();
	const profile = useQuery(api.profile.getUserProfile);
	const updateProfile = useMutation(api.profile.updateProfile);

	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useAppForm({
		defaultValues: {
			firstName: profile?.firstName ?? "",
			lastName: profile?.lastName ?? "",
			aadharNumber: profile?.aadharNumber ?? "",
			panNumber: profile?.panNumber ?? "",
			emergencyPhone: profile?.emergencyPhone ?? "",
			insurance: profile?.insurance ?? "",
			hasInsurance: profile?.hasInsurance ?? false,
		},
		validators: { onSubmit: editProfileSchema },
		onSubmit: async ({ value }) => {
			setIsSubmitting(true);
			try {
				await updateProfile({
					firstName: value.firstName || undefined,
					lastName: value.lastName || undefined,
					aadharNumber: value.aadharNumber || undefined,
					panNumber: value.panNumber || undefined,
					emergencyPhone: value.emergencyPhone || undefined,
					insurance: value.insurance || undefined,
					hasInsurance: value.hasInsurance,
				});

				Alert.alert("Profile updated", "Your profile has been saved.", [
					{
						text: "OK",
						onPress: () => router.back(),
					},
				]);
			} catch (error) {
				Alert.alert(
					"Update failed",
					error instanceof Error ? error.message : "Please try again.",
				);
			} finally {
				setIsSubmitting(false);
			}
		},
	});

	if (profile === undefined) {
		return (
			<SafeAreaView className="flex-1 items-center justify-center">
				<Stack.Screen options={{ title: "Edit Profile" }} />
				<ActivityIndicator size="large" />
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1">
			<Stack.Screen options={{ headerShown: false }} />
			<ScrollView
				className="px-6 pb-6 pt-4"
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				<Text className="text-foreground text-2xl font-bold">Edit Profile</Text>
				<Text className="text-muted-foreground mt-1 text-sm">
					Update your personal information.
				</Text>

				{/* ---- Personal Information ---- */}
				<View className="bg-card border-border mt-5 rounded-xl border p-4">
					<Text className="text-foreground mb-4 text-lg font-semibold">
						Personal Information
					</Text>

					<View className="mb-3">
						<form.AppField name="firstName">
							{(field) => (
								<field.Input
									label="First name"
									placeholder="Eg: John"
									autoCapitalize="words"
									editable={!isSubmitting}
								/>
							)}
						</form.AppField>
					</View>

					<View className="mb-3">
						<form.AppField name="lastName">
							{(field) => (
								<field.Input
									label="Last name"
									placeholder="Eg: Doe"
									autoCapitalize="words"
									editable={!isSubmitting}
								/>
							)}
						</form.AppField>
					</View>
				</View>

				{/* ---- Identification ---- */}
				<View className="bg-card border-border mt-4 rounded-xl border p-4">
					<Text className="text-foreground mb-4 text-lg font-semibold">
						Identification
					</Text>

					<View className="mb-3">
						<form.AppField name="aadharNumber">
							{(field) => (
								<field.Input
									label="Aadhar number"
									placeholder="1234 5678 9012"
									autoCapitalize="none"
									editable={!isSubmitting}
								/>
							)}
						</form.AppField>
					</View>

					<View className="mb-3">
						<form.AppField name="panNumber">
							{(field) => (
								<field.Input
									label="PAN number"
									placeholder="ABCDE1234F"
									autoCapitalize="characters"
									editable={!isSubmitting}
								/>
							)}
						</form.AppField>
					</View>
				</View>

				{/* ---- Emergency Contact ---- */}
				<View className="bg-card border-border mt-4 rounded-xl border p-4">
					<Text className="text-foreground mb-4 text-lg font-semibold">
						Emergency Contact
					</Text>

					<form.AppField name="emergencyPhone">
						{(field) => (
							<field.Input
								label="Emergency phone"
								placeholder="+1 (555) 987-6543"
								keyboardType="phone-pad"
								autoCapitalize="none"
								editable={!isSubmitting}
							/>
						)}
					</form.AppField>
				</View>

				{/* ---- Insurance ---- */}
				<View className="bg-card border-border mt-4 rounded-xl border p-4">
					<Text className="text-foreground mb-4 text-lg font-semibold">
						Insurance
					</Text>

					<form.AppField name="hasInsurance">
						{(field) => (
							<>
								<Text className="text-foreground mb-2 text-sm font-medium">
									Has insurance
								</Text>
								<View className="flex-row gap-2">
									<Pressable
										onPress={() => field.handleChange(true)}
										disabled={isSubmitting}
										className={`rounded-lg px-6 py-2 ${
											field.state.value === true
												? "bg-primary"
												: "bg-muted active:opacity-80"
										}`}
									>
										<Text
											className={`font-medium ${
												field.state.value === true
													? "text-primary-foreground"
													: "text-foreground"
											}`}
										>
											Yes
										</Text>
									</Pressable>
									<Pressable
										onPress={() => field.handleChange(false)}
										disabled={isSubmitting}
										className={`rounded-lg px-6 py-2 ${
											field.state.value === false
												? "bg-primary"
												: "bg-muted active:opacity-80"
										}`}
									>
										<Text
											className={`font-medium ${
												field.state.value === false
													? "text-primary-foreground"
													: "text-foreground"
											}`}
										>
											No
										</Text>
									</Pressable>
								</View>
							</>
						)}
					</form.AppField>

					<View className="mt-4">
						<form.AppField name="insurance">
							{(field) => (
								<field.Input
									label="Insurance details"
									placeholder="Provider, policy number, etc."
									autoCapitalize="sentences"
									editable={!isSubmitting}
								/>
							)}
						</form.AppField>
					</View>
				</View>

				{/* ---- Submit ---- */}
				<Pressable
					onPress={async () => form.handleSubmit()}
					disabled={isSubmitting}
					className={`bg-primary mt-6 rounded-lg py-3 ${
						isSubmitting ? "opacity-60" : "active:opacity-80"
					}`}
				>
					{isSubmitting ? (
						<ActivityIndicator color="#ffffff" />
					) : (
						<Text className="text-primary-foreground text-center font-semibold">
							Save changes
						</Text>
					)}
				</Pressable>
			</ScrollView>
		</SafeAreaView>
	);
}
